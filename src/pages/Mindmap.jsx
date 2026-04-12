import { useMemo, useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  addEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import Select from 'react-select'
import { useTests, useNotes } from '../hooks/useSupabase'

const NODE_COLORS = {
  root: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
  topic: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
  note: { bg: '#1e293b', border: '#475569', text: '#e2e8f0' },
}

const NODE_WIDTHS = { root: 220, topic: 180, note: 300 }
const NODE_HEIGHTS = { root: 44, topic: 44, note: 'auto' }

const selectStyles = {
  control: (base, state) => ({
    ...base,
    background: '#1e293b',
    borderColor: state.isFocused ? '#3b82f6' : '#334155',
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': { borderColor: '#3b82f6' },
    minHeight: '42px',
    width: '300px',
  }),
  menu: (base) => ({ ...base, background: '#1e293b', border: '1px solid #334155', zIndex: 20 }),
  option: (base, state) => ({ ...base, background: state.isFocused ? '#334155' : 'transparent', color: '#e2e8f0', cursor: 'pointer' }),
  singleValue: (base) => ({ ...base, color: '#e2e8f0' }),
  input: (base) => ({ ...base, color: '#e2e8f0' }),
  placeholder: (base) => ({ ...base, color: '#64748b' }),
}

// Custom note node that shows title + content
function NoteNode({ data }) {
  return (
    <div className="mindmap-note-node">
      <Handle type="target" position={Position.Left} />
      <div className="mindmap-note-title">{data.label}</div>
      {data.content && (
        <div
          className="mindmap-note-content"
          dangerouslySetInnerHTML={{ __html: data.content }}
        />
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

function TopicNode({ data }) {
  return (
    <div className="mindmap-topic-node">
      <Handle type="target" position={Position.Left} />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

function RootNode({ data }) {
  return (
    <div className="mindmap-root-node">
      <Handle type="source" position={Position.Right} />
      <span>{data.label}</span>
    </div>
  )
}

const nodeTypes = { noteNode: NoteNode, topicNode: TopicNode, rootNode: RootNode }

function getLayoutedElements(nodes, edges) {
  if (nodes.length === 0) return { nodes: [], edges: [] }

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 24 })

  nodes.forEach((node) => {
    const w = NODE_WIDTHS[node.data.type] || 200
    // Estimate height for note nodes based on content length
    let h = 44
    if (node.data.type === 'note') {
      const textLen = (node.data.content || '').replace(/<[^>]*>/g, '').length
      h = Math.max(60, Math.min(160, 60 + Math.floor(textLen / 40) * 20))
    }
    g.setNode(node.id, { width: w, height: h })
  })

  edges.forEach((edge) => g.setEdge(edge.source, edge.target))

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    const w = NODE_WIDTHS[node.data.type] || 200
    const h = g.node(node.id).height
    return { ...node, position: { x: pos.x - w / 2, y: pos.y - h / 2 } }
  })

  return { nodes: layoutedNodes, edges }
}

function buildFromTest(testName, notes) {
  const rawNodes = []
  const rawEdges = []

  rawNodes.push({
    id: 'root',
    type: 'rootNode',
    data: { label: testName, type: 'root' },
  })

  // Group notes by topic (a note can appear under multiple topics)
  const byTopic = {}
  for (const note of notes) {
    const noteTopics = note.topics?.length > 0 ? note.topics : [{ name: 'Other' }]
    for (const t of noteTopics) {
      if (!byTopic[t.name]) byTopic[t.name] = []
      byTopic[t.name].push(note)
    }
  }

  const addedNoteIds = new Set()

  for (const [topicName, topicNotes] of Object.entries(byTopic)) {
    const tId = `topic-${topicName}`
    rawNodes.push({
      id: tId,
      type: 'topicNode',
      data: { label: topicName, type: 'topic' },
    })
    rawEdges.push({
      id: `root->${tId}`,
      source: 'root',
      target: tId,
      type: 'smoothstep',
      style: { stroke: '#475569', strokeWidth: 1.5 },
    })

    for (const note of topicNotes) {
      const nId = `note-${note.id}`
      if (!addedNoteIds.has(nId)) {
        rawNodes.push({
          id: nId,
          type: 'noteNode',
          data: {
            label: note.title || 'Untitled',
            content: note.content || '',
            type: 'note',
          },
        })
        addedNoteIds.add(nId)
      }
      rawEdges.push({
        id: `${tId}->${nId}`,
        source: tId,
        target: nId,
        type: 'smoothstep',
        style: { stroke: '#475569', strokeWidth: 1.5 },
      })
    }
  }

  return getLayoutedElements(rawNodes, rawEdges)
}

function MindmapCanvas({ testId, tests, notes, notesLoading }) {
  const { fitView } = useReactFlow()

  const selectedTest = tests.find((t) => t.id === testId)
  const testNotes = useMemo(
    () => (testId ? notes.filter((n) => n.test_id === testId) : []),
    [notes, testId]
  )

  const generated = useMemo(() => {
    if (!testId || !selectedTest) return null
    if (testNotes.length === 0) return null
    return buildFromTest(selectedTest.name, testNotes)
  }, [testId, selectedTest, testNotes])

  // For empty canvas mode
  const emptyInitial = useMemo(() => [{
    id: 'root',
    type: 'rootNode',
    data: { label: 'My Mindmap', type: 'root' },
    position: { x: 250, y: 250 },
  }], [])

  const initNodes = generated ? generated.nodes : (!testId ? emptyInitial : [])
  const initEdges = generated ? generated.edges : []

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  // Sync when generated data changes
  const [appliedKey, setAppliedKey] = useState('')
  const dataKey = testId
    ? `test-${testId}-${testNotes.length}`
    : 'empty'

  useEffect(() => {
    if (dataKey === appliedKey) return
    if (testId && generated) {
      setNodes(generated.nodes)
      setEdges(generated.edges)
      setAppliedKey(dataKey)
      setTimeout(() => fitView({ padding: 0.15 }), 80)
    } else if (!testId) {
      setNodes(emptyInitial)
      setEdges([])
      setAppliedKey(dataKey)
      setTimeout(() => fitView({ padding: 0.15 }), 80)
    }
  }, [dataKey, appliedKey, testId, generated, emptyInitial, setNodes, setEdges, fitView])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 1.5 } }, eds)),
    [setEdges]
  )

  // Add new node on double-click canvas
  const onPaneDoubleClick = useCallback(
    (event) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }
      const id = `node-${Date.now()}`
      const label = prompt('Node label:')
      if (!label) return
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: 'topicNode',
          data: { label, type: 'topic' },
          position,
        },
      ])
    },
    [setNodes]
  )

  if (testId && notesLoading) {
    return <div className="loading">Loading notes...</div>
  }

  if (testId && testNotes.length === 0 && !notesLoading) {
    return (
      <div className="empty-state">
        <p>No notes found for this test.</p>
        <p>Create some notes linked to this test first.</p>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDoubleClick={onPaneDoubleClick}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#334155" gap={20} size={1} />
      <Controls
        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
      />
      <MiniMap
        style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
        nodeColor={(node) => {
          const type = node.data?.type || 'note'
          return NODE_COLORS[type]?.bg || '#1e293b'
        }}
        maskColor="rgba(15, 23, 42, 0.7)"
      />
    </ReactFlow>
  )
}

export default function Mindmap() {
  const { tests, loading: testsLoading } = useTests()
  const { notes, loading: notesLoading } = useNotes()
  const [mode, setMode] = useState('test') // 'test' or 'empty'
  const [testId, setTestId] = useState(null)

  const testOptions = tests.map((t) => ({ value: t.id, label: t.name }))
  const selectedOption = testId ? testOptions.find((o) => o.value === testId) || null : null

  return (
    <div className="page mindmap-page">
      <div className="mindmap-header">
        <div>
          <h1>Mindmap</h1>
          <p className="page-description">
            Generate a mindmap from a test or start with an empty canvas.
          </p>
        </div>
        <div className="mindmap-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: NODE_COLORS.root.bg }} />Root</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: NODE_COLORS.topic.bg }} />Topic</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: NODE_COLORS.note.border }} />Note</span>
        </div>
      </div>

      <div className="mindmap-toolbar">
        <div className="pool-tabs">
          <button
            className={`tab ${mode === 'test' ? 'active' : ''}`}
            onClick={() => setMode('test')}
          >
            From Test
          </button>
          <button
            className={`tab ${mode === 'empty' ? 'active' : ''}`}
            onClick={() => { setMode('empty'); setTestId(null) }}
          >
            Empty Canvas
          </button>
        </div>

        {mode === 'test' && (
          <Select
            options={testOptions}
            value={selectedOption}
            onChange={(opt) => setTestId(opt ? opt.value : null)}
            isLoading={testsLoading}
            isClearable
            isSearchable
            placeholder="Select a test..."
            styles={selectStyles}
          />
        )}

        {mode === 'empty' && (
          <span className="mindmap-hint">Double-click the canvas to add nodes. Drag between handles to connect.</span>
        )}
      </div>

      <div className="mindmap-container">
        <ReactFlowProvider>
          <MindmapCanvas
            testId={mode === 'test' ? testId : null}
            tests={tests}
            notes={notes}
            notesLoading={notesLoading}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}

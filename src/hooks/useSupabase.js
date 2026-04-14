import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSections() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sections')
      .select('*')
      .order('name')
    setSections(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (name) => {
    const { data, error } = await supabase
      .from('sections')
      .insert({ name })
      .select()
      .single()
    if (error) throw error
    await fetch()
    return data
  }

  const update = async (id, name) => {
    const { error } = await supabase
      .from('sections')
      .update({ name })
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { sections, loading, refetch: fetch, create, update, remove }
}

export function useTopics() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('topics')
      .select('*')
      .order('name')
    setTopics(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (name) => {
    const { data, error } = await supabase
      .from('topics')
      .insert({ name })
      .select()
      .single()
    if (error) throw error
    await fetch()
    return data
  }

  const update = async (id, name) => {
    const { error } = await supabase
      .from('topics')
      .update({ name })
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { topics, loading, refetch: fetch, create, update, remove }
}

export function useTests() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false })
    setTests(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (name) => {
    const { data, error } = await supabase
      .from('tests')
      .insert({ name })
      .select()
      .single()
    if (error) throw error
    await fetch()
    return data
  }

  const update = async (id, name) => {
    const { error } = await supabase
      .from('tests')
      .update({ name })
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { tests, loading, refetch: fetch, create, update, remove }
}

export function useNotes({ sectionId, topicId, testId, search } = {}) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    // When filtering by topic, use inner join so only matching notes return
    const topicJoin = topicId ? 'note_topics!inner(topic:topics(id, name))' : 'note_topics(topic:topics(id, name))'

    let query = supabase
      .from('notes')
      .select(`
        *,
        test:tests(id, name),
        section:sections(id, name),
        ${topicJoin}
      `)
      .order('created_at', { ascending: false })

    if (sectionId) query = query.eq('section_id', sectionId)
    if (topicId) query = query.eq('note_topics.topic_id', topicId)
    if (testId) query = query.eq('test_id', testId)
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

    const { data } = await query

    // Flatten note_topics into a topics array on each note
    const normalized = (data || []).map((note) => ({
      ...note,
      topics: (note.note_topics || []).map((nt) => nt.topic).filter(Boolean),
      note_topics: undefined,
    }))

    setNotes(normalized)
    setLoading(false)
  }, [sectionId, topicId, testId, search])

  useEffect(() => { fetch() }, [fetch])

  const create = async ({ topic_ids, ...note }) => {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
      .single()
    if (error) throw error

    // Insert junction rows for topics
    if (topic_ids && topic_ids.length > 0) {
      const rows = topic_ids.map((tid) => ({ note_id: data.id, topic_id: tid }))
      const { error: jtError } = await supabase.from('note_topics').insert(rows)
      if (jtError) throw jtError
    }

    await fetch()
    return data
  }

  const update = async (id, updates) => {
    const { topic_ids, ...fields } = updates
    const { error } = await supabase
      .from('notes')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    // If topic_ids provided, replace junction rows
    if (topic_ids !== undefined) {
      await supabase.from('note_topics').delete().eq('note_id', id)
      if (topic_ids.length > 0) {
        const rows = topic_ids.map((tid) => ({ note_id: id, topic_id: tid }))
        await supabase.from('note_topics').insert(rows)
      }
    }

    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { notes, loading, refetch: fetch, create, update, remove }
}

export function useQuickNotes({ topicId, search } = {}) {
  const [quickNotes, setQuickNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    const topicJoin = topicId
      ? 'quick_note_topics!inner(topic:topics(id, name))'
      : 'quick_note_topics(topic:topics(id, name))'

    let query = supabase
      .from('quick_notes')
      .select(`*, ${topicJoin}`)
      .order('created_at', { ascending: false })

    if (topicId) query = query.eq('quick_note_topics.topic_id', topicId)
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

    const { data } = await query

    const normalized = (data || []).map((note) => ({
      ...note,
      topics: (note.quick_note_topics || []).map((nt) => nt.topic).filter(Boolean),
      quick_note_topics: undefined,
    }))

    setQuickNotes(normalized)
    setLoading(false)
  }, [topicId, search])

  useEffect(() => { fetch() }, [fetch])

  const create = async ({ topic_ids, ...note }) => {
    const { data, error } = await supabase
      .from('quick_notes')
      .insert(note)
      .select()
      .single()
    if (error) throw error

    if (topic_ids && topic_ids.length > 0) {
      const rows = topic_ids.map((tid) => ({ quick_note_id: data.id, topic_id: tid }))
      const { error: jtError } = await supabase.from('quick_note_topics').insert(rows)
      if (jtError) throw jtError
    }

    await fetch()
    return data
  }

  const update = async (id, updates) => {
    const { topic_ids, ...fields } = updates
    const { error } = await supabase
      .from('quick_notes')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    if (topic_ids !== undefined) {
      await supabase.from('quick_note_topics').delete().eq('quick_note_id', id)
      if (topic_ids.length > 0) {
        const rows = topic_ids.map((tid) => ({ quick_note_id: id, topic_id: tid }))
        await supabase.from('quick_note_topics').insert(rows)
      }
    }

    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase
      .from('quick_notes')
      .delete()
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { quickNotes, loading, refetch: fetch, create, update, remove }
}

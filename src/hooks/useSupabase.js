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

  return { sections, loading, refetch: fetch, create }
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

  return { topics, loading, refetch: fetch, create }
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

  return { tests, loading, refetch: fetch, create }
}

export function useNotes({ sectionId, topicId, testId, search } = {}) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('notes')
      .select(`
        *,
        test:tests(id, name),
        section:sections(id, name),
        topic:topics(id, name)
      `)
      .order('created_at', { ascending: false })

    if (sectionId) query = query.eq('section_id', sectionId)
    if (topicId) query = query.eq('topic_id', topicId)
    if (testId) query = query.eq('test_id', testId)
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)

    const { data } = await query
    setNotes(data || [])
    setLoading(false)
  }, [sectionId, topicId, testId, search])

  useEffect(() => { fetch() }, [fetch])

  const create = async (note) => {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
      .single()
    if (error) throw error
    await fetch()
    return data
  }

  const update = async (id, updates) => {
    const { error } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
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

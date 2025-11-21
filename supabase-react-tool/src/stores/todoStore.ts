import { makeAutoObservable } from 'mobx'
import { supabase } from '../lib/supabase'
import type { RootStore } from './index'

export interface Todo {
  id: string
  title: string
  completed: boolean
  created_at: string
}

export class TodoStore {
  todos: Todo[] = []
  loading: boolean = true
  error: string | null = null
  rootStore: RootStore

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this)
  }

  get authStore() {
    return this.rootStore.authStore
  }

  get stats() {
    const total = this.todos.length
    const completed = this.todos.filter(t => t.completed).length || 0
    const pending = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      pending,
      completionRate
    }
  }

  setTodos = (todos: Todo[]) => {
    this.todos = todos
    this.setError(null)
  }

  setLoading = (loading: boolean) => {
    this.loading = loading
  }

  setError = (error: string | null) => {
    this.error = error
  }

  fetchTodos = async () => {
    try {
      this.setLoading(true)
      this.setError(null)
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      this.setTodos(data || [])
      this.setLoading(false)
    } catch (error: any) {
      this.setLoading(false)
      this.setError('获取待办事项失败: ' + error.message)
    }
  }

  addTodo = async (title: string) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ title, completed: false, user_id: this.authStore.user?.id }])
        .select()

      if (error) throw error

      if (data) {
        this.setTodos([data[0], ...this.todos])
      }
    } catch (error: any) {
      this.setError('添加待办事项失败: ' + error.message)
    }
  }

  toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error

      this.setTodos(this.todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (error: any) {
      this.setError('更新待办事项失败: ' + error.message)
    }
  }

  deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      this.setTodos(this.todos.filter(todo => todo.id !== id))
    } catch (error: any) {
      this.setError('删除待办事项失败: ' + error.message)
    }
  }
}

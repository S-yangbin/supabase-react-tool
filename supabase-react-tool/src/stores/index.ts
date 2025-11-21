import { createContext, useContext } from 'react'
import { makeAutoObservable } from 'mobx'
import { TodoStore } from './todoStore'
import { AuthStore } from './authStore'

export class RootStore {
  todoStore: TodoStore
  authStore: AuthStore

  constructor() {
    this.authStore = new AuthStore()
    this.todoStore = new TodoStore(this)
    makeAutoObservable(this)
  }
}

export const rootStore = new RootStore()

export const StoreContext = createContext<RootStore>(rootStore)

export const useStore = () => useContext(StoreContext)

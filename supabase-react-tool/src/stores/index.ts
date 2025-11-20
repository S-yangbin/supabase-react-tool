import { createContext, useContext } from 'react'
import { makeAutoObservable } from 'mobx'

class RootStore {
  constructor() {
    makeAutoObservable(this)
  }
}

export const rootStore = new RootStore()

export const StoreContext = createContext<RootStore>(rootStore)

export const useStore = () => useContext(StoreContext)
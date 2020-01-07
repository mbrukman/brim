/* @flow */

import {changeSearchBarInput} from "../actions"
import History from "../history"
import initTestStore from "../../test/initTestStore"
import submitSearch from "../../flows/submitSearch"

let store
beforeEach(() => {
  store = initTestStore()
  store.dispatchAll([
    changeSearchBarInput("first"),
    submitSearch(),
    changeSearchBarInput("second"),
    submitSearch(),
    changeSearchBarInput("third"),
    submitSearch()
  ])
})

test("pushing history", () => {
  const state = store.getState()
  const entry = History.current(state)
  expect(entry.program).toEqual("third")
})

test("moving back changes the position", () => {
  let state = store.dispatchAll([History.back()])
  const entry = History.current(state)
  expect(entry.program).toEqual("second")
})

test("going forward in history", () => {
  let state = store.dispatchAll([
    History.back(),
    History.back(),
    History.forward()
  ])
  const entry = History.current(state)
  expect(entry.program).toEqual("second")
})

test("going back in history then pushing new history", () => {
  let state = store.dispatchAll([
    History.back(),
    History.back(),
    changeSearchBarInput("fourth"),
    submitSearch()
  ])
  const entry = History.current(state)
  expect(entry.program).toEqual("fourth")
})

test("back, back, push, back", () => {
  let state = store.dispatchAll([
    History.back(),
    History.back(),
    changeSearchBarInput("fourth"),
    submitSearch(),
    History.back()
  ])
  const entry = History.current(state)
  expect(entry.program).toEqual("first")
})

test("clearing history", () => {
  let state = store.dispatchAll([History.clear()])
  expect(History.current(state)).toBe(undefined)
})

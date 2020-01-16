/* @flow */

import {changeSearchBarInput, setCurrentSpaceName} from "../state/actions"
import MockBoomClient from "../test/MockBoomClient"
import Search from "../state/Search"
import Spaces from "../state/Spaces"
import Tab from "../state/tab"
import brim from "../brim"
import initTestStore from "../test/initTestStore"
import submitSearch from "./submitSearch"

let store, boom
beforeEach(() => {
  boom = new MockBoomClient({host: "localhost", port: 123})
  store = initTestStore(boom)
})

const spaceInfo = {
  name: "ranch-logs",
  min_time: {sec: 1425564900, ns: 0},
  max_time: {sec: 1428917793, ns: 750000000},
  size: 4580591172,
  packet_support: true,
  compression: "none",
  flush_timeout: 500,
  close_timeout: 5000,
  slab_threshold: 131072,
  slab_fanout: 8,
  max_writers: 150,
  path: "./"
}

const initTimeWindow = () => (dispatch: Function, getState: Function) => {
  let space = Tab.space(getState())
  if (space) {
    let {min_time, max_time} = space
    dispatch(Search.setSpanArgs([min_time, max_time]))
  }
}

test("fetching a regular search", () => {
  boom.stub("search")
  store.dispatchAll([
    Search.setCluster("1"),
    Spaces.setDetail("1", spaceInfo),
    setCurrentSpaceName("ranch-logs"),
    initTimeWindow(),
    changeSearchBarInput("_path=conn")
  ])

  store.clearActions()
  store.dispatch(submitSearch())

  expect(store.getActions().map((a) => a.type)).toMatchSnapshot()
})

test("not saving a search to history", () => {
  boom.stub("search")
  store.dispatchAll([
    Search.setCluster("1"),
    Spaces.setDetail("1", spaceInfo),
    setCurrentSpaceName("ranch-logs"),
    changeSearchBarInput("_path=conn")
  ])

  store.clearActions()
  store.dispatch(submitSearch(false))

  expect(store.getActions().map((a) => a.type)).toMatchSnapshot()
})

test("fetching an analytic search", () => {
  boom.stub("search")
  store.dispatchAll([
    Search.setCluster("1"),
    Spaces.setDetail("1", spaceInfo),
    setCurrentSpaceName("ranch-logs"),
    initTimeWindow(),
    changeSearchBarInput("_path=conn | count()")
  ])

  store.clearActions()
  store.dispatch(submitSearch())

  expect(store.getActions().map((a) => a.type)).toMatchSnapshot()
})

test("fetching an analytic search without history", () => {
  boom.stub("search")
  store.dispatchAll([
    Search.setCluster("1"),
    Spaces.setDetail("1", spaceInfo),
    setCurrentSpaceName("ranch-logs"),
    initTimeWindow(),
    changeSearchBarInput("_path=conn | count()")
  ])

  store.clearActions()
  store.dispatch(submitSearch(false))

  expect(store.getActions().map((a) => a.type)).toMatchSnapshot()
})

test("fetching an zoom search", () => {
  boom.stub("search")
  store.dispatchAll([
    Search.setCluster("1"),
    Spaces.setDetail("1", spaceInfo),
    setCurrentSpaceName("ranch-logs"),
    initTimeWindow(),
    Search.setSpanFocus(brim.time.convertToSpan([new Date(0), new Date(1)])),
    changeSearchBarInput("_path=conn | count()")
  ])

  store.clearActions()
  store.dispatch(submitSearch())

  expect(store.getActions().map((a) => a.type)).toMatchSnapshot()
})

test("fetching an zoom search without history", () => {
  boom.stub("search")
  store.dispatchAll([
    Search.setCluster("1"),
    Spaces.setDetail("1", spaceInfo),
    setCurrentSpaceName("ranch-logs"),
    initTimeWindow(),
    changeSearchBarInput("_path=conn | count()"),
    submitSearch()
  ])

  store.clearActions()
  store.dispatch(submitSearch(false))

  expect(store.getActions().map((a) => a.type)).toMatchSnapshot()
})

test("a bad search query", () => {
  boom.stub("search")
  const actions = [
    Search.setCluster("1"),
    Spaces.setDetail("1", spaceInfo),
    setCurrentSpaceName("ranch-logs"),
    changeSearchBarInput("_ath="),
    submitSearch()
  ]
  actions.forEach(store.dispatch)

  expect(store.getActions().map((action) => action.type)).toEqual(
    expect.arrayContaining(["SEARCH_BAR_PARSE_ERROR"])
  )
})

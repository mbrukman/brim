/* @flow */
import {useDispatch, useSelector} from "react-redux"
import {useEffect, useState} from "react"

import {accumResults} from "../../lib/accumResults"
import {fetchSearch} from "../../services/boom"
import {getCurrentSpaceName} from "../../state/reducers/spaces"

import search from "../../state/search"
import tasks from "../../state/tasks"

type Opts = {name: string, program: string}

export default function useSearch(opts: Opts) {
  let dispatch = useDispatch()
  let span = useSelector(search.getSpanAsDates)
  let space = useSelector(getCurrentSpaceName)
  let [results, setResults] = useState({descriptors: {}, tuples: {}})
  let [stats, setStats] = useState({})
  let [status, setStatus] = useState("FETCHING")

  useEffect(() => {
    let {program, name} = opts
    let handler = dispatch(fetchSearch(program, span, space))
    let accum = accumResults()
    dispatch(tasks.register(name, program, handler))

    handler.stream((payload) => {
      switch (payload.type) {
        case "SearchDescriptors":
          accum.addDescriptors(payload.descriptors)
          break
        case "SearchTuples":
          accum.addTuples(payload.tuples, payload.channel_id.toString())
          setResults(accum.getResults())
          break
        case "SearchStats":
          setStats(payload)
          break
        case "SearchEnd":
          setStatus("SUCCESS")
          break
        case "TaskEnd":
          if (payload.error) {
            setStatus("ERROR")
            break
          }
      }
    })

    return () => handler.abort()
  }, [])

  return [results, status, stats]
}

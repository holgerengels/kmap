import {createStore, ModelsState, ModelsDispatch, routingPluginFactory} from '@captaincodeman/rdx-model'
import { devtools, persist} from '@captaincodeman/rdx'
import { routeMatcher } from './routes'
import * as models from './models'

const routingPlugin = routingPluginFactory(routeMatcher)

let rdxstore = createStore({ models, plugins: [routingPlugin] })

// These could be commented out if the extra functionality
// wasn't required, to create a production bundle without
// the redux devtools enabled for instance. This could be
// controlled using rollup with the replace plugin, e.g.
//
// if (process.env.NODE_ENV !== 'production') {
//   rdxstore = devtools(rdxstore)

rdxstore = devtools(rdxstore)
rdxstore = persist(rdxstore)

export { rdxstore }

export type Store = typeof rdxstore
export type State = ModelsState<typeof models> // & { routing: RoutingState }
export type Dispatch = ModelsDispatch<typeof models> // { routing: RoutingDispatch }

import createMatcher from '@captaincodeman/router'
import { routingPluginFactory } from '@captaincodeman/rdx-model'
import * as models from './models'

// NOTE: the /:app prefix of the routes is to handle github pages

const routes = {
  '/app':                                  'home',
  '/app/browser/:subject/:chapter':        'browser',
  '/app/browser/:subject/:chapter/:topic': 'browser',
  '/app/test':                             'test',
  '/app/test/:results':                    'test',
  '/app/test/:subject/:chapter(/:topic)':  'test',
  '/app/courses':                          'courses',
  '/app/content-manager':                  'content-manager',
}                                                 ;

const matcher = createMatcher(routes)
const routing = routingPluginFactory(matcher)

export const config = { models, plugins: { routing } }

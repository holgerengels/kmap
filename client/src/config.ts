import createMatcher from '@captaincodeman/router'
import { routingPlugin } from '@captaincodeman/rdx'
import * as models from './models'

const routes = {
  '/app/':                                       'home',
  '/app/browser/:subject/:chapter':              'browser',
  '/app/browser/:subject/:chapter/:topic':       'browser',
  '/app/exercise/:subject/:chapter/:topic/:key': 'exercise',
  '/app/test':                                   'test',
  '/app/test/:results':                          'test',
  '/app/test/:subject/:chapter(/:topic)':        'test',
  '/app/blog':                                   'blog',
  '/app/blog/:post':                             'blog',
  '/app/courses':                                'courses',
  '/app/content-manager':                        'content-manager',
};

const matcher = createMatcher(routes)
const routing = routingPlugin(matcher)

export const config = { models, plugins: { routing } }

import createMatcher from '@captaincodeman/router';

// NOTE: the /:app prefix of the routes is to handle github pages

const routes = {
  '/:app':                                  'home',
  '/:app/browser/:subject/:chapter':        'browser',
  '/:app/browser/:subject/:chapter/:topic': 'browser',
  '/:app/test':                             'test',
  '/:app/test/results':                     'test',
  '/:app/test/:subject/:chapter':           'test',
  '/:app/test/:subject/:chapter/:topic':    'test',
  '/:app/courses':                          'courses',
  '/:app/content-manager':                  'content-manager',
}                                                 ;

export const routeMatcher = createMatcher(routes);

import createMatcher from '@captaincodeman/router';

// NOTE: the /:app prefix of the routes is to handle github pages

const routes = {
  '/:app/':                        'home',
  '/:app/browser/:chapter':        'browser',
  '/:app/browser/:chapter/:topic': 'browser',
  '/:app/test':                    'test',
  '/:app/test/:chapter':           'test',
  '/:app/test/:chapter/:topic':    'test',
  '/:app/courses':                 'courses',
  '/:app/content-manager':         'content-manager',
}                                                 ;

export const routeMatcher = createMatcher(routes);

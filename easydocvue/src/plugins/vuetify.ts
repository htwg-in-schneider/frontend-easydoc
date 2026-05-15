/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'easydoc',
    themes: {
      easydoc: {
        dark: false,
        colors: {
          primary: '#155dfc',
          secondary: '#7AAE38',
          background: '#ffffff',
          surface: '#ffffff',
        },
      },
    },
  },
})

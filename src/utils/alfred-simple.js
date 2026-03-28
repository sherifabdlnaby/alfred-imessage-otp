/**
 * Simplified Alfred utilities
 * Replaces the 120-line Alfred class with simple functions
 */

const alfred = {
  /**
   * Get user input from command line arguments
   */
  get input() {
    return process.argv.slice(2).join(' ') || '';
  },

  /**
   * Output items to Alfred
   */
  output(items, { rerun = 1, variables = {} } = {}) {
    console.log(JSON.stringify({ items, rerun, variables }, null, '\t'));
  },

  /**
   * Output an error message
   */
  error(error) {
    const stack = error.stack || error;
    const errorTitle = error.stack ? `${error.name}: ${error.message}` : error;

    this.output([
      {
        title: errorTitle,
        subtitle: 'Press ⌘L to see the full error and ⌘C to copy it.',
        valid: false,
        text: {
          copy: stack,
          largetype: stack,
        },
        icon: {
          path: '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns',
        },
      },
    ]);
  },

  /**
   * System icons helper
   */
  icons: {
    error: '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns',
    warning: '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertCautionIcon.icns',
    info: '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/ToolbarInfo.icns',
  },
};

// Set up global error handler
process.on('uncaughtException', (error) => {
  alfred.error(error);
});

module.exports = alfred;

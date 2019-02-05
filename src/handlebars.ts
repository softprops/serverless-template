import * as handlebars from 'handlebars';

export function registerHelpers() {
  handlebars.registerHelper({
    eq: function(a: any, b: any, options: handlebars.HelperOptions) {
      return a === b ? options.fn(this) : options.inverse(this);
    }
  });
}

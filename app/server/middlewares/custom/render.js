import path from 'path';
import marko from 'marko';
import settings from 'server/initializers/settings';

export default function* (next) {
  this.render = this.render ||
    function (template: string, parameters: Object = {}) {
      this.type = 'text/html';

      return new Promise(resolve => {
        const templatePath = path.join(settings.path.ROOT, `${settings.path.TEMPLATES_DIR}/${template}`);
        let currentTemplate;

        if (process.env.NODE_ENV === 'production') {
          currentTemplate = require(templatePath);
        } else {
          currentTemplate = marko.load(templatePath);
        }

        resolve(
          currentTemplate.stream({
            ...settings,
            ...parameters,
            csrf: this.csrf,
          })
        );
      });
    };

  yield next;
}

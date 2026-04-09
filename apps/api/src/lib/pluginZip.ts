import archiver from 'archiver';
import { PassThrough } from 'stream';

export interface PluginZipOptions {
  slug: string;
  name: string;
  version: string;
  description: string;
  phpFileContent: string;
  changelog?: string;
}

/**
 * Builds a WordPress plugin .zip in memory and returns a readable stream.
 * The zip contains:
 *   plugin-slug/plugin-slug.php   — the PHP source
 *   plugin-slug/readme.txt        — auto-generated readme
 */
export function buildPluginZip(opts: PluginZipOptions): PassThrough {
  const { slug, name, version, description, phpFileContent, changelog } = opts;

  const passThrough = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 6 } });

  archive.on('error', (err) => passThrough.destroy(err));
  archive.pipe(passThrough);

  archive.append(phpFileContent, { name: `${slug}/${slug}.php` });

  const readme = buildReadme({ name, version, description, changelog });
  archive.append(readme, { name: `${slug}/readme.txt` });

  archive.finalize();

  return passThrough;
}

function buildReadme(opts: {
  name: string;
  version: string;
  description: string;
  changelog?: string;
}): string {
  return `=== ${opts.name} ===
Version: ${opts.version}
Stable tag: ${opts.version}
Requires at least: 5.0
Tested up to: 6.5
License: Proprietary

${opts.description}

== Description ==
${opts.description}

== Installation ==
1. Download the plugin ZIP from your PouchCare account.
2. In WordPress admin, go to Plugins > Add New > Upload Plugin.
3. Upload the ZIP file and activate the plugin.
4. Go to Settings > ${opts.name} to enter your PouchCare credentials and activate.

== Changelog ==
= ${opts.version} =
${opts.changelog ?? 'Initial release.'}
`;
}

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/'],
    },
    sitemap: 'https://www.pigpigtalk.com/sitemap.xml',
  }
}

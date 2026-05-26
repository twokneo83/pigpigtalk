export default function sitemap() {
  return [
    {
      url: 'https://www.pigpigtalk.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.pigpigtalk.com/survey',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}

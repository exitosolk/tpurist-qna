import { MetadataRoute } from 'next'
import { query } from '@/lib/db'

export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://oneceylon.space'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/questions`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/questions/ask`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/users`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/collectives`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tuktuk-prices`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scams`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Fetch questions
  const questionsResult = await query(
    `SELECT id, created_at, edited_at 
     FROM questions 
     ORDER BY created_at DESC 
     LIMIT 1000`
  )

  const questionPages: MetadataRoute.Sitemap = questionsResult.rows.map((q: any) => ({
    url: `${baseUrl}/questions/${q.id}`,
    lastModified: new Date(q.edited_at || q.created_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Fetch tags
  const tagsResult = await query(
    `SELECT t.name, MAX(q.created_at) as last_used, COUNT(qt.question_id) as question_count
     FROM tags t
     LEFT JOIN question_tags qt ON t.id = qt.tag_id
     LEFT JOIN questions q ON qt.question_id = q.id
     GROUP BY t.id, t.name
     HAVING question_count > 0
     ORDER BY question_count DESC
     LIMIT 100`
  )

  const tagPages: MetadataRoute.Sitemap = tagsResult.rows.map((tag: any) => ({
    url: `${baseUrl}/questions/tagged/${encodeURIComponent(tag.name)}`,
    lastModified: tag.last_used ? new Date(tag.last_used) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Fetch users
  const usersResult = await query(
    `SELECT username, created_at 
     FROM users 
     WHERE reputation > 10
     ORDER BY reputation DESC 
     LIMIT 100`
  )

  const userPages: MetadataRoute.Sitemap = usersResult.rows.map((user: any) => ({
    url: `${baseUrl}/users/${user.username}`,
    lastModified: new Date(user.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // Fetch collectives
  const collectivesResult = await query(
    `SELECT slug, created_at 
     FROM collectives 
     ORDER BY member_count DESC`
  )

  const collectivePages: MetadataRoute.Sitemap = collectivesResult.rows.map((c: any) => ({
    url: `${baseUrl}/collectives/${c.slug}`,
    lastModified: new Date(c.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...staticPages,
    ...questionPages,
    ...tagPages,
    ...userPages,
    ...collectivePages,
  ]
}

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TaskFlow',
    short_name: 'TaskFlow',
    description: 'Shaxsiy rivojlanish menejeri',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#4F7FFF',
    icons: [],
  }
}

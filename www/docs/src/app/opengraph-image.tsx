import { ogImage, ogSize } from '@/lib/og'

export const size = ogSize
export const contentType = 'image/png'
export const alt = 'nrz docs'

const Image = () => ogImage('Documentation')

export default Image

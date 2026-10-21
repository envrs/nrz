import { NrzClient } from '@/components/icons/nrz-client'
import { Vsr } from '@/components/icons/vsr'
import { OpenSourceInitiative } from '@/components/icons/open-source-initiative'
import {
  BookOpen,
  Megaphone,
  LaptopMinimal,
  FlaskConical,
  Package,
  Share2,
  SearchCheck,
  Rss,
  ShieldHalf,
  ScanEye,
  Antenna,
} from 'lucide-react'
import type { MenuData, MenuGroup } from './types'

// nrz.khulnasoft.com's marketing paths are site-relative; the docs live on another host
const NRZ = 'https://www.nrz.khulnasoft.com'

export const getMenuContent = (): MenuData[] => {
  const openSourceGroup: MenuGroup = {
    group: 'Open Source',
    children: [
      {
        icon: OpenSourceInitiative,
        label: 'Packages & Ecosystem',
        subtitle: 'Explore all nrz packages, tools, and libraries',
        path: NRZ + '/open-source',
        featured: true,
      },
      {
        icon: NrzClient,
        label: 'Package Manager',
        subtitle: 'Fastest and secure package management',
        path: NRZ + '/open-source/client',
      },
      {
        icon: Vsr,
        label: 'VSR',
        subtitle: 'Self-hosted serverless registry',
        path: NRZ + '/open-source/serverless-registry',
      },
      {
        icon: SearchCheck,
        label: 'Policies',
        subtitle: 'Dependency policy CI gates',
        path: NRZ + '/open-source/policies',
      },
      {
        icon: FlaskConical,
        label: 'Reproducibility',
        subtitle: 'Origin source & artifact verification',
        path: NRZ + '/open-source/reproduce',
      },
    ],
  }

  const platformGroup: MenuGroup = {
    group: 'Platform',
    children: [
      {
        icon: Antenna,
        label: 'Registry',
        subtitle: 'The private registry for teams',
        path: NRZ + '/platform/registry',
      },
      {
        icon: ShieldHalf,
        label: 'Security',
        subtitle: 'Safe registry-level protection',
        path: NRZ + '/platform/security',
      },
      {
        icon: ScanEye,
        label: 'Observability',
        subtitle: 'Explore and trace your supply chain',
        path: NRZ + '/platform/observability',
      },
      {
        icon: Package,
        label: 'Packages',
        subtitle: 'Hosted Package Registries & Mirrors',
        path: NRZ + '/platform/packages',
      },
      {
        icon: Share2,
        label: 'Projects',
        subtitle: 'Advanced Dependency Graph Observability',
        path: NRZ + '/platform/projects',
      },
    ],
  }

  return [
    platformGroup,
    openSourceGroup,
    {
      group: 'Company',
      children: [
        {
          icon: Rss,
          label: 'Blog',
          subtitle: 'Latest news',
          path: NRZ + '/blog',
        },
        {
          icon: BookOpen,
          label: 'About',
          subtitle: 'Our mission',
          path: NRZ + '/about',
        },
        {
          icon: Megaphone,
          label: 'Press',
          subtitle: 'Latest coverage',
          path: NRZ + '/press',
        },
        {
          icon: LaptopMinimal,
          label: 'Careers',
          subtitle: 'Join the Team',
          path: NRZ + '/careers',
          badge: "We're hiring!",
        },
      ],
    },
    { label: 'Pricing', path: NRZ + '/pricing' },
    {
      label: 'Benchmarks',
      path: 'https://benchmarks.nrz.khulnasoft.com',
      target: '_blank',
    },
    {
      label: 'Community',
      path: 'https://discord.com/invite/qdbXTqxZzZ',
      target: '_blank',
    },
    { label: 'Feedback', path: '/feedback' },
  ]
}

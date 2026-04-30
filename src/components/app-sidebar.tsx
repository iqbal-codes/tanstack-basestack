'use client'

import {
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings2,
  Users,
} from 'lucide-react'
import { useTranslations } from 'use-intl'

import { NavMain } from '#/components/nav-main'
import { NavUser } from '#/components/nav-user'
import { TeamSwitcher } from '#/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '#/components/ui/sidebar'

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const t = useTranslations('sidebar')
  const ta = useTranslations('admin')

  const data = {
    teams: [
      {
        name: ta('console'),
        logo: GalleryVerticalEnd,
        plan: t('protected'),
      },
    ],
    navMain: [
      {
        title: t('overview'),
        url: '/admin',
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: t('users'),
        url: '/admin/users',
        icon: Users,
      },
      {
        title: t('system'),
        url: '/admin/system',
        icon: Settings2,
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

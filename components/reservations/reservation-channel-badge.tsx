import { Phone, MessageCircle, Instagram, Users, MonitorSmartphone, Globe } from 'lucide-react'

const channelConfig = {
  PHONE:     { label: 'Telefone',   Icon: Phone,            classes: 'text-slate-500' },
  WHATSAPP:  { label: 'WhatsApp',   Icon: MessageCircle,    classes: 'text-green-600' },
  INSTAGRAM: { label: 'Instagram',  Icon: Instagram,        classes: 'text-pink-500' },
  WALK_IN:   { label: 'Presencial', Icon: Users,            classes: 'text-slate-500' },
  APP:       { label: 'App',        Icon: MonitorSmartphone, classes: 'text-blue-500' },
  WEBSITE:   { label: 'Website',    Icon: Globe,            classes: 'text-slate-500' },
}

export function ReservationChannelBadge({ channel }: { channel: string }) {
  const config = channelConfig[channel as keyof typeof channelConfig]
  if (!config) return <span className="text-xs text-slate-400">{channel}</span>
  const { label, Icon, classes } = config

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${classes}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

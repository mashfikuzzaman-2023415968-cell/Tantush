import { getDictionary } from "@lib/i18n/server"
import { Marquee } from "@modules/common/components/motion/marquee"

export default async function AnnouncementBar() {
  const { t } = await getDictionary()
  return (
    <div className="bg-espresso text-ivory-200 text-[12px] tracking-wide h-9 flex items-center">
      <Marquee items={[...t.announcement, ...t.announcement]} className="w-full" />
    </div>
  )
}

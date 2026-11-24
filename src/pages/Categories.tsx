import { categories } from '../data/sample'
import { CategoryTile } from '../components/cards'
import { PageHero } from '../components/ui'

export default function Categories() {
  return (
    <div>
      <PageHero
        eyebrow="ক্যাটাগরি"
        title="কোর্স ক্যাটাগরি"
        subtitle="আপনার লক্ষ্য অনুযায়ী ক্যাটাগরি বেছে নিয়ে কোর্স খুঁজুন। কোর্সের সংখ্যা নমুনা।"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryTile key={c.id} category={c} />
          ))}
        </div>
      </div>
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'
import { blogPosts, getBlogBySlug } from '../data/sample'
import { BlogCard } from '../components/cards'
import { Breadcrumbs, ErrorState, PageHero, SampleBadge } from '../components/ui'

export default function Blog() {
  return (
    <div>
      <PageHero
        eyebrow="ব্লগ"
        title="ব্লগ"
        subtitle="পড়াশোনার কৌশল, ভর্তি প্রস্তুতি ও পরীক্ষার গাইড — লেখাগুলো নমুনা।"
      />
      <div className="flex flex-1 flex-col bg-[var(--color-page-2)] dark:bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {blogPosts.map((p) => (
            <BlogCard key={p.slug} post={p} />
          ))}
        </div>
        <div className="min-h-10 flex-1" aria-hidden="true" />
        <div className="rounded-3xl bg-[var(--color-primary-soft)] p-6 text-center sm:p-8">
          <h2 className="text-xl font-extrabold">আরও পড়তে চান?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-body)]">
            কোর্সে ভর্তি হয়ে হাতে-কলমে শিখুন, অথবা বইয়ের দোকান থেকে প্রস্তুতির বই নিন।
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/courses" className="btn-primary text-sm">
              সব কোর্স দেখুন
            </Link>
            <Link to="/books" className="btn-outline bg-white text-sm">
              বইয়ের দোকান
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export function BlogDetails() {
  const { slug } = useParams()
  const post = slug ? getBlogBySlug(slug) : undefined

  if (!post) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="ব্লগটি পাওয়া যায়নি" message="এই লিংকের কোনো নমুনা ব্লগ নেই।" />
        <div className="mt-6 text-center">
          <Link to="/blog" className="btn-primary text-sm">
            সব ব্লগ দেখুন
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="hero-wave border-b border-blue-100 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Breadcrumbs items={[{ label: 'ব্লগ', to: '/blog' }, { label: post.title }]} />
          <span className="inline-flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-white">{post.category}</span>
            <SampleBadge />
          </span>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-sm text-[var(--color-body)]">
            {post.author} · {post.date} · {post.readMin} মিনিট পড়া
          </p>
        </div>
      </div>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {post.body.map((para, i) => (
          <p key={i} className="mb-5 text-[16px] leading-[1.8] text-[var(--color-body)]">
            {para}
          </p>
        ))}
        <div className="card mt-8 p-5">
          <p className="text-sm leading-relaxed text-[var(--color-body)]">
            এই ব্লগটি নমুনা কনটেন্ট। পরীক্ষার অফিসিয়াল তথ্য সবসময় শিক্ষা বোর্ড বা সংশ্লিষ্ট কর্তৃপক্ষের বিজ্ঞপ্তি
            থেকে যাচাই করুন।
          </p>
          <Link to="/blog" className="btn-outline mt-4 text-sm">
            আরও ব্লগ পড়ুন
          </Link>
        </div>
      </article>
    </div>
  )
}

import Head from 'next/head'
import Link from 'next/link'

export async function getStaticProps(context) {
  
  const url = process.env.API_ENDPOINT
  
  const res = await fetch(url)
  const data = await res.json()

  return { props: { data } }
}

export default function Home({ data }) {
  return (
    <div>
      <Head>
        <title>photos.</title>
        <meta name="description" content="Photos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="text-3xl font-bold underline">
          photos.
        </h1>

        <p>
          You have {data.Count} <Link href="/photos"><a>photos</a></Link> so far.
        </p>

      </main>
      <footer>
        <Link href="https://www.micahwalter.com">
          <a>micahwalter.com</a>
        </Link>      
      </footer>
    </div>
  )
}

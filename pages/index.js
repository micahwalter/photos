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
    <>
      <Head>
        <title>photos.</title>
      </Head>

      <div className="container mx-auto px-4">
        <h1 className="text-2xl">
          photos.
        </h1>

        <p>
          You have {data.Count} <Link href="/photos"><a>photos</a></Link> so far.
        </p>

      </div>
    </>
  );
}
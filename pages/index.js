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

      <div>
        <h1>
          photos.
        </h1>

        <p>
          You have {data.Count} <Link href="/photos"><a>photos</a></Link> so far.
        </p>

      </div>
    </>
  );
}
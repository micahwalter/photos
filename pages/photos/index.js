import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

export async function getStaticProps(context) {
  
  const url = process.env.API_ENDPOINT
  
  const res = await fetch(url)
  const data = await res.json()

  return { props: { data } }
}

export default function Photos({ data }) {
  return (
    <div>
      <Head>
        <title>photos.</title>
        <meta name="description" content="Photos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>
          photos.
        </h1>

        {data.Items.map(photo => 
          <p key={photo.id}>
            <Link href={`/photos/${photo.id}`}><a>
            <Image
                src={`${process.env.CLOUDFRONT_ENDPOINT}${photo.images.t.key}`}
                width={photo.images.t.width}
                height={photo.images.t.height}
            />
            </a></Link>
          </p>
        )}

      </main>
      <footer>
        <Link href="https://www.micahwalter.com">
          <a>micahwalter.com</a>
        </Link>      
      </footer>
    </div>
  )
}

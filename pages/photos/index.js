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

    <>
      <Head>
        <title>photos.</title>
      </Head>

      <div>
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
      </div>
    </>
  );
}

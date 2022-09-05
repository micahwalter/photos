import Head from 'next/head'
import Image from 'next/image'

export async function getStaticPaths() {
  const url = process.env.API_ENDPOINT
  
  const res = await fetch(url)
  const photos = await res.json()

  const paths = photos.Items.map((photo) => ({
    params: { id:  photo.id.toString() },
  }))

  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const url = process.env.API_ENDPOINT + params.id
  
  const res = await fetch(url)
  const data = await res.json()

  return {
    props: {
      data,
    },
  };
}

export default function Photo({ data }) {
  
  for (var key in data.Item.metadata.iptc) {
    console.log("Key: " + key);
    console.log("Value: " + data.Item.metadata.iptc[key]);
  }

  return (
    <>
      <Head>
        <title>photos.</title>
        <meta name="description" content="Photos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <h1>
          {data.Item.metadata.iptc.title}
        </h1>

        <p>{data.Item.metadata.iptc.caption}</p>

        <Image
          src={`${process.env.CLOUDFRONT_ENDPOINT}${data.Item.images.m.key}`}
          width={data.Item.images.m.width}
          height={data.Item.images.m.height}
        />

        <h1>
          Images
        </h1>

        <pre>
        {JSON.stringify(data.Item.images, null, 4)}
        </pre>
        
        <h1>
          IPTC
        </h1>

        <pre>
        {JSON.stringify(data.Item.metadata.iptc, null, 4)}
        </pre>

        <h1>
          EXIF
        </h1>

        <pre>
        {JSON.stringify(data.Item.metadata.exif, null, 4)}
        </pre>
      </div>
    </>
  );
}

import Head from 'next/head'
import Image from 'next/image'
import styles from '../../styles/Home.module.css'
import Link from 'next/link'

export async function getServerSideProps(context) {
  
  const url = process.env.API_ENDPOINT + context.params.id
  
  const res = await fetch(url)
  const data = await res.json()

  return { props: { data } }
}

export default function Photo({ data }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>photos.</title>
        <meta name="description" content="Photos" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          photos.
        </h1>

        <p>{data.Item.id}</p>

        <Image
          src={`${process.env.CLOUDFRONT_ENDPOINT}${data.Item.images.m.key}`}
          width={data.Item.images.m.width}
          height={data.Item.images.m.height}
        />

      </main>
      <footer className={styles.footer}>
        <Link href="https://www.micahwalter.com">
          <a>micahwalter.com</a>
        </Link>      
      </footer>
    </div>
  )
}

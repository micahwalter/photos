import Head from 'next/head'
import Image from 'next/image'
import styles from '../../styles/Home.module.css'
import Link from 'next/link'

export async function getServerSideProps(context) {
  
  const url = "https://vxel9fe85d.execute-api.us-east-1.amazonaws.com/prod/" + context.params.id
  
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

        <p>{data.Item.title}</p>

      </main>
      <footer className={styles.footer}>
        <Link href="https://www.micahwalter.com">
          <a>micahwalter.com</a>
        </Link>      
      </footer>
    </div>
  )
}

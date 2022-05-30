import { getNextStaticProps } from '@faustjs/next';

import { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import React from 'react';
import { Footer, Header } from 'components';
import { client } from 'client';
import Link from 'next/link'

export default function Page() {
  const { useQuery } = client;
  const generalSettings = useQuery().generalSettings;
  const categories = useQuery().categories({
    first: 50,
  });

  return (
    <>
      <Header
        title={generalSettings.title}
        description={generalSettings.description}
      />

      <Head>
        <title>
          {generalSettings.title} - {generalSettings.description}
        </title>
      </Head>

      <main className="content">
        {categories && (
          <ul>
            {categories.nodes.map(category => {
              const { id, name, slug } = category;
              if (category.slug) {
                return (
                  <li key={id}><Link href={slug}><a>{name}</a></Link></li>
                )
              }
          })}
          </ul>
        )}
      </main>
    </>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  return getNextStaticProps(context, {
    Page,
    client,
  });
}

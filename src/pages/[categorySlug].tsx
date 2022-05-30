import { getNextStaticProps, is404 } from '@faustjs/next';
import Head from 'next/head';
import { Header, Footer, Posts, Pagination } from 'components';
import { GetStaticPropsContext } from 'next';
import { useRouter } from 'next/router';
import { client, Maybe, RootQueryToPostConnectionWhereArgs, Scalars, Query, TaxonomyEnum, RootQueryToPostConnectionWhereArgsTaxQueryOperator, RootQueryToPostConnectionWhereArgsTaxQueryField, RelationEnum } from 'client';
import useArticleTypes from 'hooks/useArticleTypes';

interface IPostsConnectionArgs {
	after?: Maybe<Scalars['String']>;
	before?: Maybe<Scalars['String']>;
	first?: Maybe<Scalars['Int']>;
	last?: Maybe<Scalars['Int']>;
	where?: Maybe<RootQueryToPostConnectionWhereArgs>;
  isMerge: boolean;
}

const POSTS_PER_PAGE = 10;

export default function Page() {
  const { useQuery, usePaginatedQuery, useCategory } = client;
  const { query = {} } = useRouter();
  const { categorySlug, paginationTerm, categoryCursor } = query;
  const generalSettings = useQuery().generalSettings;
  const category = useCategory();

  const { data, fetchMore, isLoading } = usePaginatedQuery(
    (
      // Auto-generated query object
      query: Query,
      // You have to specify the arguments types, in this example we are re-using auto-generated types
      input: IPostsConnectionArgs,
    ) => {
      const isMerge = input.isMerge;
      const posts = query.posts({
        after: input.after,
        before: input.before,
        first: input.first,
        last: input.last,
        where: input.where,
      });

      const preppedPosts = posts.nodes.map(post => ({
        id: post.id,
        title: post.title(),
        categories: post.categories().nodes.map(category => ({
          name: category.name,
        })),
      }));

      return {
        posts: preppedPosts,
        hasNextPage: posts.pageInfo.hasNextPage,
        endCursor: posts.pageInfo.endCursor,
        isMerge,
      };
    },
    {
      // Required, only used for the first fetch
      initialArgs: {
        first: POSTS_PER_PAGE,
        isMerge: true,
        where: {
          categoryName: categorySlug as string,
        }
      },
      // Optional merge function
      merge({ data: { existing, incoming }, uniqBy }) {
        if (!incoming.isMerge) return incoming;
        if (existing) {
          return {
            ...incoming,
            // If using 'cache-and-network', you have to use `uniqBy`
            posts: uniqBy([...existing.posts, ...incoming.posts], (post) => post.id),
          };
        }
        return incoming;
      },
    },
  );

  const articleTypes = useArticleTypes(categorySlug as string)

  return (
    <>
      <Header
        title={generalSettings.title}
        description={generalSettings.description}
      />

      <Head>
        <title>Posts - {generalSettings?.title}</title>
      </Head>
   
      <main className="content content-single">
        {articleTypes && (
          <ul>
            {articleTypes.map((type) => (
              <li key={type.slug}><button onClick={() => fetchMore(
                {
                  first: POSTS_PER_PAGE,
                  where: {
                    categoryName: categorySlug as string,
                    ...(type.slug !== 'all' && {taxQuery: {
                      taxArray: [{
                        taxArray: [
                          {
                            taxonomy: TaxonomyEnum.ARTICLETYPE,
                            operator: RootQueryToPostConnectionWhereArgsTaxQueryOperator.IN,
                            terms: [type.slug],
                            field: RootQueryToPostConnectionWhereArgsTaxQueryField.SLUG,
                          },
                        ],
                        relation: RelationEnum.AND,
                      }]
                    }})
                  },
                  isMerge: false,
                  after: null,
                },
              )}>{type.name}</button></li>
            ))}
          </ul>
        )}
        <div className="wrap">
          <h2>Category: {category?.name}</h2>
           {data?.posts?.map((post) => 
            <h2 key={post.id}>
              {post.title} ({post.categories.map((category)=> {return `${category.name}, `})})
            </h2>
            )} 
           {data?.hasNextPage && (
              <button
                onClick={() => {
                  fetchMore({
                    first: POSTS_PER_PAGE,
                    after: data.endCursor,
                    isMerge: true,
                    where: {
                      categoryName: categorySlug as string,
                    }
                  });
                }}
              >
                More posts{isLoading && '...'}
              </button>
              )}
        </div>
      </main>
    </>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  return getNextStaticProps(context, {
    Page,
    client,
    notFound: await is404(context, { client }),
  });
}

export function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}
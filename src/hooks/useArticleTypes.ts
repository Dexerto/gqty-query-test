import {
	client,
	ArticleTypeToPostConnectionWhereArgs,
} from 'client';

interface IArticleType {
	/**
	 * Name of the articleType.
	 */
	name: string;
	/**
	 * Slug of the articleType.
	 */
	slug: string;
	/**
	 * Start cursor for the articleType posts. Used to check if any posts exist within that articleType.
	 */
	startCursor: string;
}

/**
 * Fetch all articleTypes associated with the current category.
 * @param slug Category or vertical slug.
 * @returns Array of articleTypes.
 */
const useArticleTypes = (slug: string): IArticleType[] => {
	const { useQuery } = client;
	let queryWhere: ArticleTypeToPostConnectionWhereArgs;

	queryWhere = { categoryName: slug };


	const articleTypes = useQuery()
		?.articleTypes({
			where: { hideEmpty: true },
		})
		?.edges?.map((item) => ({
			name: item?.node?.name as string,
			slug: item?.node?.slug as string,
			startCursor: item?.node?.posts({
				first: 1,
				where: queryWhere,
			})?.pageInfo?.startCursor as string,
		}))
		.filter((item) => item.startCursor !== null);

	const allArticleTypes = [
		{
			name: 'All',
			slug: 'all',
			startCursor: '',
		},
	];

	if (articleTypes) allArticleTypes.push(...articleTypes);

	return allArticleTypes;
};

export default useArticleTypes;

(async () => {
    const token = null; // Replace with actual token if available
  
    const fetchQuery = async (operation, variables) => {
      const resp = await fetch("https://easyword.hasura.app/v1beta1/relay", {
        method: "POST",
        body: JSON.stringify({
          query: operation.text,
          variables: variables
        }),
        headers: token
          ? {
              "content-type": "application/json",
              "authorization": `Bearer ${token}`
            }
          : {
              "content-type": "application/json"
            }
      });
  
      const result = await resp.json();
      if (resp.ok && !result.errors) {
        return result;
      } else {
        throw new Error(result.errors ? result.errors[0].message : "Request failed: " + resp.statusText);
      }
    };
  
    const query = `
      query JargonListOrderRefetchQuery(
        $categoryIDs: [Int!]
        $count: Int = 100
        $cursor: String
        $directions: [jargon_order_by!]
        $onlyWithoutTranslationFilter: [jargon_bool_exp!]
        $searchTerm: String
      ) {
        jargon_connection(
          order_by: $directions, 
          first: $count, 
          after: $cursor, 
          where: {
            _and: [
              {_or: [{name_lower_no_spaces: {_iregex: $searchTerm}}, {translations: {name_lower_no_spaces: {_iregex: $searchTerm}}}]}, 
              {_or: [{jargon_categories: {category_id: {_in: $categoryIDs}}}, {_not: {jargon_categories: {_and: []}}}]}, 
              {_and: $onlyWithoutTranslationFilter}
            ]
          }
        ) {
          edges {
            node {
              id
              name
              updated_at
              jargon_categories(order_by: {category: {name: asc}}) {
                category {
                  acronym
                  id
                }
                id
              }
              translations(order_by: {name: asc}, limit: 20) {
                id
                name
              }
              comments_aggregate {
                aggregate {
                  count
                }
              }
            }
            cursor
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    `;
  
    const initialVariables = {
      categoryIDs: [3,9,2,5,8,7,6,1,10,4],
      count: 100,
      cursor: null,
      directions: [{"updated_at":"desc"},{"name_lower":"asc"}],
      onlyWithoutTranslationFilter: [],
      searchTerm: ""
    };
  
    let allJargons = [];
    let hasNextPage = true;
    let currentCursor = null;
  
    try {
      while (hasNextPage) {
        const variables = { ...initialVariables, cursor: currentCursor };
        const result = await fetchQuery({ text: query }, variables);
        
        if (result.data && result.data.jargon_connection) {
          const { edges, pageInfo } = result.data.jargon_connection;
          allJargons = allJargons.concat(edges.map(edge => edge.node));
          hasNextPage = pageInfo.hasNextPage;
          currentCursor = pageInfo.endCursor;
          
          console.log(`Fetched ${edges.length} jargons. Total: ${allJargons.length}`);
        } else {
          hasNextPage = false;
        }
      }
  
      console.log("All jargons fetched:", allJargons);
      console.log("Total number of jargons:", allJargons.length);
    } catch (error) {
      console.error("Error:", error.message);
    }
  })();
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
      $count: Int = 40
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

  const variables = {
    categoryIDs: [3,9,2,5,8,7,6,1,10,4],
    count: 40,
    cursor: "eyJ1cGRhdGVkX2F0IiA6ICIyMDIzLTAyLTIxVDE2OjE5OjMzLjYxNSswMDowMCIsICJuYW1lX2xvd2VyIiA6ICJhYnN0cmFjdGlvbiIsICJpZCIgOiAiM2I3NjA2NDQtNWNjZC00ODM2LTgwYmUtMDFiZWFmNDgxYmU1In0=",
    directions: [{"updated_at":"desc"},{"name_lower":"asc"}],
    onlyWithoutTranslationFilter: [],
    searchTerm: ""
  };

  try {
    const result = await fetchQuery({ text: query }, variables);
    console.log("Query result:", result);
    
    // Log the first jargon item if available
    if (result.data && result.data.jargon_connection && result.data.jargon_connection.edges.length > 0) {
      console.log("First jargon item:", result.data.jargon_connection.edges[0].node);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
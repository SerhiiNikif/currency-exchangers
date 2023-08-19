const getMostProfitableExchangersQuery = `
WITH Query1 AS (
    -- Request for convert of major currencies
    SELECT  eo.country, 
            e.id as exchangeId, 
            r.from, 
            r.to,
            e."exchangeOfficeId",
            e.ask * r.in AS basicExchange
    FROM exchange_offices eo
    JOIN exchanges e ON eo.id = e."exchangeOfficeId"
    JOIN rates r ON e."exchangeOfficeId" = r."exchangeOfficeId"
    WHERE e.date >= NOW() - INTERVAL '1 month'
    AND r.date >= NOW() - INTERVAL '1 month'
    AND e.from = r.to
    AND e.to = r.from
    GROUP BY eo.country, e.id, r.from, r.to, e."exchangeOfficeId", e.ask, r.in
),

Query2 AS (
    -- Request to convert Query1 to USD
    SELECT 	q1.country,
            q1.exchangeId,
            q1.basicExchange * r.out as basicToUSD -- 100 EUR * 1.1
    FROM rates r
    JOIN Query1 q1 ON r.from = q1.to AND r.to = 'USD' AND r."exchangeOfficeId" = q1."exchangeOfficeId"
    WHERE r.date >= NOW() - INTERVAL '1 month'
    GROUP BY q1.country, q1.exchangeId, r.out, q1.basicExchange -- 100 EUR -> 110 USD
),

Query3 AS (
    -- Request to convert ask to USD
    SELECT 	eo.id as officeId,
            eo.name as officeName,
            e.id as exchangeId,
            e.ask * r.in as askToUSD -- 4000 UAH * 0.028
    FROM exchange_offices eo
    JOIN exchanges e ON eo.id = e."exchangeOfficeId"
    JOIN rates r ON e."exchangeOfficeId" = r."exchangeOfficeId"
    WHERE e.date >= NOW() - INTERVAL '1 month'
        AND r.date >= NOW() - INTERVAL '1 month'
        AND r.from = e.to
        AND r.to = 'USD'
    GROUP BY eo.id, eo.name, e.id, e.ask, r.in -- 4000 UAH -> 112 USD
),

Query4 AS (
    -- Request to get the difference between Query3 and Query2
    SELECT 	q3.officeId,
            q3.officeName,
            q3.exchangeId,
            q3.askToUSD - q2.basicToUSD as profitForEachExchange, -- 112 USD - 110 USD
            q2.country
    FROM Query2 q2
    JOIN Query3 q3 ON q3.exchangeId = q2.exchangeId
    GROUP BY q3.officeId, q3.officeName, q3.exchangeId, q3.askToUSD, q2.basicToUSD, q2.country
),

Query5 AS (
    -- Request to get the amount of exchanges for the exchanger
    SELECT 	q4.officeId,
            q4.officeName,
            SUM(q4.profitForEachExchange) AS sumProfitForEachExchanger,
            q4.country
    FROM Query4 q4
    GROUP BY q4.country, q4.officeId, q4.officeName
)

-- Request for the most profitable exchanger for each country
SELECT 
    q5.officeId,
    q5.officeName,
	q5.profit,
    q5.country
FROM (
    SELECT 
        q5.officeId,
        q5.officeName,
        q5.country, 
        MAX(q5.sumProfitForEachExchanger) AS profit,
        RANK() OVER (PARTITION BY q5.country ORDER BY MAX(q5.sumProfitForEachExchanger) DESC) AS countryRank
    FROM Query5 q5
    GROUP BY q5.country, q5.officeId, q5.officeName
) q5
WHERE countryRank = 1
ORDER BY profit DESC;
`;

module.exports = {
    getMostProfitableExchangersQuery
};
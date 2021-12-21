import { getManyBy, getSingleBy } from 'helpers'
import { EntityRepository, getConnection, Repository } from 'typeorm'
import { EthereumSales, SaleQueue, SaleRegistration, Sales, SoldTemplates } from './sale.entity'
export const getSaleBy = getSingleBy(Sales)
export const getEthereumSaleBy = getSingleBy(EthereumSales)
export const getSaleQueueBy = getSingleBy(SaleQueue)
export const getSaleQueuesBy = getManyBy(SaleQueue)
export const getSaleRegistrationBy = getSingleBy(SaleRegistration)
@EntityRepository(Sales)
export class SaleRepository extends Repository<Sales> {}
@EntityRepository(EthereumSales)
export class EthereumSaleRepository extends Repository<EthereumSales> {}

@EntityRepository(SaleRegistration)
export class SaleRegistrationRepository extends Repository<SaleRegistration> {}

@EntityRepository(SaleQueue)
export class SaleQueueRepository extends Repository<SaleQueue> {}

@EntityRepository(SoldTemplates)
export class SoldTemplatesRepository extends Repository<SoldTemplates> {}

export async function getNextRank(saleId: number) {
  const sql = `
    SELECT
      COALESCE(max(rank),0) as "rank"
    FROM
      "sale_registration"
    WHERE
      "saleId"=$1`
  const [result] = await getConnection().query(sql, [saleId])
  const nextRank = result.rank + 1
  return nextRank
}

export async function getAllRegistrations(saleId: number) {
  const sql = `
    SELECT
      "userId",
      "username",
      "created" as "registrationTime"
    FROM
      "sale_registration"
    WHERE
      "saleId"=$1
    ORDER BY
      "rank" asc`
  const result = await getConnection().query(sql, [saleId])
  return result
}

export async function saleList(userId: string, operatorId: number) {
  const sql = `
    SELECT
      "sales".*,
      "collections"."collection",
      "collections"."collectionName",
      "collections"."collectionCoverImage",
      "collections"."collectionDescription",
      "sales"."templateImage" as "collectionImage",
      CASE WHEN "userId" is NULL then '0' else '1' end as "registered"
    FROM
      "sales" 
    JOIN
      "collections"
    ON
      "sales"."collectionId" = "collections"."id"
    LEFT JOIN
    (
      SELECT
        "saleId",
        "userId"
      FROM 
        "sale_registration"
      WHERE
        "userId" = $1
    ) as "u"
    ON
      "sales"."id" = "u"."saleId"
    WHERE
      "sales"."isEnabled" = true AND
      "sales"."isFeatured" = true AND
      CASE WHEN 12 = 1 then true else "sales"."operatorId" = $2 END
    ORDER BY
      "registrationStartTime" desc`
  const result = await getConnection().query(sql, [userId, operatorId])
  return result
}

export async function saleListByCollection(userId: string, collection: string, operatorId: number) {
  const sql = `
    SELECT
      "sales".*,
      "collections"."collection",
      "collections"."collectionName",
      "collections"."collectionImage",
      "collections"."collectionCoverImage",
      "collections"."collectionDescription",
      CASE WHEN "userId" is NULL then '0' else '1' end as "registered",
      COALESCE("unitsSold",0) "unitsSold",
      COALESCE("unitsBoughtByUser",0) "unitsBoughtByUser"
    FROM 
      "sales" 
    JOIN
      "collections"
    ON
      "sales"."collectionId" = "collections"."id"
    LEFT JOIN
    (
      SELECT 
        "saleId",
        "userId"
      FROM 
        "sale_registration"
      WHERE
        "userId" = $1
    ) as "u"
    ON
      "sales"."id" = "u"."saleId"
    LEFT JOIN
      (   
        SELECT
          "saleId",
          COALESCE(sum("units"),0) as "unitsSold",
          COALESCE(sum(CASE WHEN "userId" = $1 then "units" else 0 end),0) "unitsBoughtByUser"
        FROM 
          "sold_templates"
        WHERE
          "txnStatus" is true
        GROUP BY
          "saleId"
      ) as "sold"
    ON
      "sales"."id" = "sold"."saleId"
    WHERE
      "collection" = $2 AND
      "isEnabled" = true AND
      "saleEndTime" > NOW() AND
      CASE WHEN $3 = 1 then true else "sales"."operatorId" = $3 END
    ORDER BY
        "registrationStartTime" desc`
  const result = await getConnection().query(sql, [userId, collection, operatorId])
  return result
}

export async function saleListPublic(operatorId: number) {
  const sql = `
    SELECT
      "sales".*,
      "collections"."collection",
      "collections"."collectionName",
      "collections"."collectionCoverImage",
      "collections"."collectionDescription",
      "sales"."templateImage" as "collectionImage"
    FROM 
      "sales"
    JOIN
      "collections"
    ON
      "sales"."collectionId" = "collections"."id"
    WHERE
      "sales"."isFeatured" = true AND
      "isEnabled" = true AND
      CASE WHEN $1 = 1 then true else "sales"."operatorId" = $1 END
    ORDER BY
      "registrationStartTime" desc`
  const result = await getConnection().query(sql, [operatorId])
  return result
}

export async function saleIdList() {
  const sql = `
    SELECT
      "id"
    FROM 
      "sales"
    ORDER BY
      "registrationStartTime" desc`
  const result = await getConnection().query(sql, [])
  return result
}

export async function filterSalePayment(saleId: number, startDatetime, endDatetime, skip, limit) {
  const query = saleId ? `"s"."saleId" = ${saleId} AND` : ''
  const sql = `
    SELECT 
      "s".*,
      "users"."email", "users"."username",
      "payments"."id",
      "sales"."id","sales"."templateName",
      "sales"."templateId",
      "payments"."paymentFor", "payments"."stripePaymentDescription"
    FROM
      "sold_templates" as "s"
    LEFT JOIN 
      "payments"
    ON
      "s"."paymentId" = "payments"."id"
    JOIN
      "users"
    ON
      "s"."userId" = "users"."id"
    JOIN
      "sales"
    ON
      "s"."saleId" = "sales"."id"
    WHERE 
      ${query}
      "s"."txnStatus" = true AND
      "s"."amount" != 0 AND
      "s"."created" BETWEEN $1 AND $2
    ORDER BY
      "s"."created" desc  
    OFFSET $3
    LIMIT  $4 
      `
  const result = await getConnection().query(sql, [startDatetime, endDatetime, skip, limit])
  return result
}

export async function salesAllPayment(saleId: number) {
  const sql = `
    SELECT
      "payments"."id",
      "sold_templates"."amount" as "saleAmount",
      "payments"."amount" as "paymentAmount",
      "payments"."status",
      "sold_templates"."txnStatus",
      "payments"."userId",
      "users"."email",
      "payments"."created"
    FROM
      "payments"
    JOIN 
      "sold_templates"
    ON
      "sold_templates"."paymentId" = "payments"."id"
    JOIN 
      "users"
    ON
      "users"."id" = "payments"."userId"
    WHERE 
      "sold_templates"."saleId" = $1
    ORDER BY 
      "users"."email" asc, 
      "payments"."created" asc`
  const result = await getConnection().query(sql, [saleId])
  return result
}

export async function allSalePayment(skip: number, limit: number) {
  const sql = `
    SELECT 
      "s".*,
      "users"."email", "users"."username",
      "payments"."id","payments"."status","payments"."paymentFor", "payments"."stripePaymentDescription",
      "sales"."id","sales"."templateName","sales"."templateId"
    FROM
      "sold_templates" as "s"
    LEFT JOIN 
      "payments"
    ON
      "s"."paymentId" = "payments"."id"
    JOIN
      "users"
    ON
      "s"."userId" = "users"."id"
    JOIN
      "sales"
    ON
      "s"."saleId" = "sales"."id"
    WHERE 
      "s"."txnStatus" = true AND "s"."amount" != 0
    ORDER BY
      "s"."created" desc
    OFFSET $1
    LIMIT  $2  
      `
  const result = await getConnection().query(sql, [skip, limit])
  return result
}

export async function soldTemplatesTotalAmountAndCount() {
  const sql = `
    SELECT 
      SUM(("s"."amount")::float)/100 as "totalAmounts",count("s"."id") as "totalCount"
      FROM
      "sold_templates" as "s"
    LEFT JOIN 
      "payments"
    ON
      "s"."paymentId" = "payments"."id"
    JOIN
      "users"
    ON
      "s"."userId" = "users"."id"
    JOIN
      "sales"
    ON
      "s"."saleId" = "sales"."id"
    WHERE 
      "s"."txnStatus" = true AND "s"."amount" != 0`
  const [result] = await getConnection().query(sql, [])
  return result
}

// export async function soldTemplatesTotalAmountAndCount() {
//   const sql = `
//     SELECT
//       SUM(amount/100) as "totalAmounts",count("id") as "totalCount"
//     FROM
//       "sold_templates"
//     WHERE
//       "txnStatus" = true`
//   const [result] = await getConnection().query(sql, [])
//   return result
// }

export async function soldTemplateTotalAmountAndCount(saleId: number, startDatetime, endDatetime) {
  const query = saleId ? `"s"."saleId" = ${saleId} AND` : ''
  const sql = `
    SELECT 
    SUM(("s"."amount")::float)/100 as "totalAmounts",count("s"."id") as "totalCount"
    FROM
    "sold_templates" as "s"
  LEFT JOIN 
    "payments"
  ON
    "s"."paymentId" = "payments"."id"
  JOIN
    "users"
  ON
    "s"."userId" = "users"."id"
  JOIN
    "sales"
  ON
    "s"."saleId" = "sales"."id"
    WHERE 
    ${query}
    "s"."txnStatus" = true AND 
    "s"."created" BETWEEN $1 AND $2`
  const result = await getConnection().query(sql, [startDatetime, endDatetime])
  return result[0]
}

export async function saleListByCollectionPublic(collection: string, operatorId: number) {
  const sql = `
    SELECT
      "sales".*,
      "collections"."collection",
      "collections"."collectionName",
      "collections"."collectionImage",
      "collections"."collectionCoverImage",
      "collections"."collectionDescription",
      COALESCE("unitsSold",0) "unitsSold"
    FROM 
      "sales"
    JOIN
      "collections"
    ON
      "sales"."collectionId" = "collections"."id"
    LEFT JOIN
      (   
        SELECT
          "saleId",
          COALESCE(sum("units"),0) as "unitsSold"
        FROM 
          "sold_templates"
        WHERE
          "txnStatus" is true
        GROUP BY
          "saleId"
      ) as "sold"
    ON
      "sales"."id" = "sold"."saleId"
    WHERE
      "collection" = $1 AND
      "isEnabled" = true AND
      "saleEndTime" > NOW() AND
      CASE WHEN $2 = 1 then true else "sales"."operatorId" = $2 END
    ORDER BY
      "registrationStartTime" desc`
  const result = await getConnection().query(sql, [collection, operatorId])
  return result
}

export async function updateSaleQueue(saleId: number, registrations: any) {
  let subQuery = '(CASE '
  for (const row of registrations) {
    subQuery = subQuery + `WHEN "userId" = '${row.userId}' then ${row.rank} `
  }
  subQuery = subQuery + 'END)'
  const query = `
    UPDATE 
      "sale_registration"
    SET
      rank = ${subQuery}
    WHERE 
      "saleId" = $1`
  const result = await getConnection().query(query, [saleId])
  return result
}

export async function totalUnitsBought(saleId: number) {
  const query = `
    SELECT
      COALESCE(sum("units"),0) as "totalUnits"
    FROM 
      "sold_templates"
    WHERE
      "saleId"=$1 AND
      "txnStatus" is true`
  const [result] = await getConnection().query(query, [saleId])
  return result.totalUnits || 0
}

export async function totalUnitsBoughtByUser(saleId: number, userId: string) {
  const query = `
    SELECT
      COALESCE(sum("units"),0) as "totalUnits"
    FROM 
      "sold_templates"
    WHERE
      "saleId"=$1  AND
      "userId"=$2 AND
      "txnStatus" is true`
  const [result] = await getConnection().query(query, [saleId, userId])
  return result.totalUnits
}

export async function getCurrentSlot(saleId: number) {
  const query = `
    SELECT
      *
    FROM 
      "sale_queue"
    WHERE
      "saleId"=$1 AND
      "slotStartTime" <= NOW() AND
      "slotEndTime" > Now()`
  const [result] = await getConnection().query(query, [saleId])
  return result
}

export async function getSaleLastSlot(saleId: number) {
  const query = `
    SELECT
      *
    FROM 
      "sale_queue"
    WHERE
      "saleId"=$1
    ORDER BY 
      "slotEndTime" desc limit 1`
  const [result] = await getConnection().query(query, [saleId])
  return result
}

export async function getSlotForRankDetails(rank: number, saleId: number) {
  const query = `
    SELECT
      min("slotStartTime") as "startTime",
      max("slotEndTime") as "endTime"
    FROM 
      "sale_queue"
    WHERE
      "saleId"=$1 AND
      "minRank" <= $2 AND
      "maxRank" >= $2`
  const result = await getConnection().query(query, [saleId, rank])
  return result
}

export async function getAllRegisteredUsers(saleId: number) {
  const query = `
    SELECT
      "sale_registration"."rank" as "rank",
      "users"."username" as "username",
      "users"."email" as "email"
    FROM 
      "sale_registration"
    JOIN
      "users"      
    ON
      "sale_registration"."userId" = "users"."id"
    WHERE
      "saleId"=$1
    ORDER BY 
      "rank" asc`
  const result = await getConnection().query(query, [saleId])
  return result
}

export async function getTotalReservedNFTs(assetCon: string, saleId: number) {
  const query = `
    SELECT
      SUM("maxIssue") as "value"
    FROM 
      "sales"
    WHERE
      "assetCon"=$1 AND
      "blockchain" = 2 AND
      "id" != $2`
  const result = await getConnection().query(query, [assetCon, saleId])
  return result
}

export async function fetchRefundListAdmin(saleId: number) {
  const sql = `SELECT 
                st.id, 
                st."saleId", 
                st."userId", 
                st.amount AS samount, 
                p.amount AS pamount, 
                u.email, 
                u.username,
                st."txnMessage" AS "error",
                p."id" as "paymentId",
                "p"."isRefunded"
              FROM 
                sold_templates AS st 
              left join 
                payments AS p ON st."paymentId" = p.id 
              left join 
                users AS u ON st."userId" = u.id 
              WHERE 
                st."txnStatus" = false AND 
                st."paymentId" != '' AND 
                p."status" = 1 AND
                "saleId" = $1`

  const result = await getConnection().query(sql, [saleId])
  return result
}

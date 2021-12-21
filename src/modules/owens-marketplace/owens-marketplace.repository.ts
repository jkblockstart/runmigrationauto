import { getManyBy, getSingleBy } from 'helpers'
import { EntityRepository, getConnection, Repository } from 'typeorm'
import {
  AddedSchemas,
  AddedTemplates,
  AssetsHighlights,
  Collections,
  OwenTokens,
  PendingAssets,
  TransferredAssets,
} from './owens-marketplace.entity'
import { BlockchainEnum } from './owens-marketplace.interface'

@EntityRepository(OwenTokens)
export class OwenTokensRepository extends Repository<OwenTokens> {}

@EntityRepository(TransferredAssets)
export class TransferredAssetsRepository extends Repository<TransferredAssets> {}

@EntityRepository(Collections)
export class CollectionsRepository extends Repository<Collections> {}

@EntityRepository(AddedSchemas)
export class AddedSchemasRepository extends Repository<AddedSchemas> {}

@EntityRepository(AddedTemplates)
export class AddedTemplatesRepository extends Repository<AddedTemplates> {}

@EntityRepository(PendingAssets)
export class PendingAssetsRepository extends Repository<PendingAssets> {}

@EntityRepository(AssetsHighlights)
export class AssetsHighlightsRepository extends Repository<AssetsHighlights> {}

export const getCollectionBy = getSingleBy(Collections)
export const getPendingAssetBy = getSingleBy(PendingAssets)

export const getAssetsHighlights = getManyBy(AssetsHighlights)
export const getCollectionHighlights = getManyBy(Collections)

export async function getTokenDetails(startDatetime, endDatetime, skip, limit) {
  const sql = `
    SELECT
      "t".*,
      "users"."email",
      "users"."username",
      "payments"."paymentFor", "payments"."stripePaymentDescription"
    FROM
      "owen_tokens" as "t"
    LEFT JOIN 
      "payments"
    ON
      "t"."paymentId" = "payments"."id"
    JOIN
      "users"
    ON
      "t"."userId" = "users"."id"
    WHERE 
      "t"."created" BETWEEN $1 AND $2
    ORDER BY
      "t"."created" desc
    OFFSET $3
    LIMIT  $4   
      `

  const result = await getConnection().query(sql, [startDatetime, endDatetime, skip, limit])
  return result
}

export async function getTransferredAssetsDetails(startDatetime, endDatetime, skip, limit) {
  const sql = `
    SELECT 
      "t".*,
      "users"."email",
      "users"."username"
    FROM
      "transferred_assets" as "t"
    JOIN
      "users"
    ON
      "t"."userId" = "users"."id"
    WHERE 
      "t"."created" BETWEEN $1 AND $2
    ORDER BY
      "t"."created" desc
    OFFSET $3
    LIMIT  $4 `

  const result = await getConnection().query(sql, [startDatetime, endDatetime, skip, limit])
  return result
}

export async function getTransferredAssetsTotalCount(startDatetime, endDatetime) {
  const sql = `
    SELECT 
      count("t"."id") as "totalCount"
    FROM
      "transferred_assets" as "t"
    JOIN
      "users"
    ON
      "t"."userId" = "users"."id"
    WHERE 
      "t"."created" BETWEEN $1 AND $2`

  const result = await getConnection().query(sql, [startDatetime, endDatetime])
  return result[0]
}

export async function markAssetsTransferSuccessful(ids: string[]) {
  const idsString = `'${ids.join("','")}'`
  const sql = `
    UPDATE
      "transferred_assets"
    SET
      "status" = true
    WHERE
      "id" IN (${idsString})`

  const result = await getConnection().query(sql, [])
  return result
}

export async function totalAmountAndCountToken(startDatetime, endDatetime) {
  const sql = `
    SELECT 
      SUM(amount),count("id") as "totalCount"
    FROM
      "owen_tokens" as "t"
    WHERE
      "t"."created" BETWEEN $1 AND $2`
  const result = await getConnection().query(sql, [startDatetime, endDatetime])
  return result[0]
}

export async function searchCollections(keyword: string) {
  keyword = `%${keyword}%`
  const sql = `
    SELECT 
      "collection" as "id",
      "collectionName" as "name",
      "collectionImage" as "image",
      'collection' as "type"
    FROM
      "collections"
    WHERE
      (lower("collection") LIKE lower($1) OR 
      lower("collectionName") LIKE lower($1) OR 
      lower("collectionDescription") LIKE lower($1))
    GROUP BY 
      "collection","collectionName", "collectionImage", "type"`

  const result = await getConnection().query(sql, [keyword])
  return result
}

export async function getCollection() {
  const sql = `
    SELECT 
      "t".*
    FROM
      "collections" as "t"
    ORDER BY 
      "t"."isFeatured" desc`

  const result = await getConnection().query(sql, [])
  return result
}

export async function updateCollection(collection: string, isFeatured: boolean, isHighlight: boolean) {
  const query = `
    UPDATE
      "collections"
    SET
      "isFeatured" = $2,"isHighlight"=$3
    WHERE
      "collection" = $1`
  const result = await getConnection().query(query, [collection, isFeatured, isHighlight])
  return result
}

export async function getLastAddedcollection(userId: string) {
  const query = `
    SELECT
      collection
    FROM 
      "collections"
    WHERE
      "addedBy"= $1 AND
      "txnStatus" = true AND
      "blockchain" = $2
    ORDER BY 
      "modified" desc LIMIT 1`
  const result = await getConnection().query(query, [userId, BlockchainEnum.Wax])
  return result
}

export async function getAddedCollectionsList(userId: string, operatorId: number, blockchain: number) {
  const query = `
    SELECT
      "collection",
      "collectionName",
      "id" as "collectionId"
    FROM 
      "collections"
    WHERE
      "addedBy"= $1 AND
      "txnStatus" = true AND
      "operatorId" = $2 AND
      "blockchain" = $3`
  const result = await getConnection().query(query, [userId, operatorId, blockchain])
  return result
}

export async function getAssetIdHighlights(assetId: string, assetCon: string, blockchain: number, operatorId: number) {
  const query = `
    SELECT
      *
    FROM 
      "assets_highlights"
    WHERE
      "assetId"= $1 AND
      "assetCon" = $2 AND
      "blockchain" = $3 AND
      "operatorId" = $4
    ORDER BY
      "rank" asc`
  const result = await getConnection().query(query, [assetId, assetCon, blockchain, operatorId])
  return result
}

export async function updateAssetIdHighlights(
  assetId: string,
  assetCon: string,
  BlockChain: number,
  isHighlight: boolean,
  operatorId: number
) {
  const query = `
    UPDATE
      "assets_highlights"
    SET
      "isHighlight"=$4
    WHERE
      "assetId"= $1 AND
      "assetCon" = $2 AND
      "blockchain" = $3 AND
      "operatorId" = $5`
  const result = await getConnection().query(query, [assetId, assetCon, BlockChain, isHighlight, operatorId])
  return result
}

export async function getAssetIdHighlightsList(operatorId: number) {
  const query = `
    SELECT
      "assetId",
      "assetCon",
      "blockchain"
    FROM 
      "assets_highlights"
    WHERE
      "isHighlight"=true AND 
      "operatorId"=$1
    ORDER BY
      "rank" asc`
  const result = await getConnection().query(query, [operatorId])
  return result
}

export async function getCollectionsHighlightList(operatorId: number) {
  const query = `
  SELECT
    "collection",
    "collectionName",
    "collectionImage",
    "collectionCoverImage",
    "collectionDescription",
    "isFeatured",
    "blockchain"
  FROM 
    "collections"
  WHERE
    "isHighlight"= true AND 
    "operatorId"=$1
  ORDER BY
    "rank" asc`
  const result = await getConnection().query(query, [operatorId])
  return result
}

export async function updateAssetHiglightsRank(assets: any, operatorId: number) {
  let subQuery = '(CASE '
  for (const row of assets) {
    subQuery = subQuery + `WHEN "assetId" = '${row.assetId}' AND  "assetCon" = '${row.assetCon}' then ${row.rank} `
  }
  subQuery = subQuery + 'END)'
  const query = `
    UPDATE 
      "assets_highlights"
    SET
      rank = ${subQuery}
      WHERE
      "operatorId"=$1`
  const result = await getConnection().query(query, [operatorId])
  return result
}

export async function updateColletionHiglightsRank(assets: any, operatorId: number) {
  let subQuery = '(CASE '
  for (const row of assets) {
    subQuery = subQuery + `WHEN "collection" = '${row.collection}' then ${row.rank} `
  }
  subQuery = subQuery + 'END)'
  const query = `
    UPDATE 
      "collections"
    SET
      rank = ${subQuery}
      WHERE
      "operatorId"=$1`
  const result = await getConnection().query(query, [operatorId])
  return result
}

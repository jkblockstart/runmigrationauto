import { getManyBy, getSingleBy } from 'helpers'
import { EntityRepository, getConnection, Repository } from 'typeorm'
import { ChallengePartialParticipations, ChallengeParticipations, Challenges } from './challenge.entity'

export const getChallengeBy = getSingleBy(Challenges)
export const getChallengesBy = getManyBy(Challenges)
export const getChallengeParticipationBy = getSingleBy(ChallengeParticipations)
export const getChallengeParticipationsBy = getManyBy(ChallengeParticipations)
export const getChallengePartialParticipationBy = getSingleBy(ChallengePartialParticipations)
export const getChallengePartialParticipationsBy = getManyBy(ChallengePartialParticipations)
@EntityRepository(Challenges)
export class ChallengeRepository extends Repository<Challenges> {}

@EntityRepository(ChallengeParticipations)
export class ChallengeParticipationsRepository extends Repository<ChallengeParticipations> {}

@EntityRepository(ChallengePartialParticipations)
export class ChallengePartialParticipationsRepository extends Repository<ChallengePartialParticipations> {}

export async function markCardSubmissionSuccessful(ids: string[], status: boolean, txnMessage: string, txnId: string) {
  const idsString = `'${ids.join("','")}'`
  const sql = `
      UPDATE
        "challenge_participations"
      SET
        "txnStatus" = $1 ,"txnMessage" = $2 ,"txnId" =$3
      WHERE
        "id" IN (${idsString})`

  const result = await getConnection().query(sql, [status, txnMessage, txnId])
  return result
}

export async function getTotalSubmissionForActiveChallenges(challengesId: string[]) {
  const sql = `
  SELECT
        "challengeId" ,
        count(DISTINCT "userId") as "totalSubmission" 
        FROM
          "challenge_participations"
        WHERE
          "txnStatus" = true AND
          "challengeId" IN (${challengesId})
  group by 
  "challengeId"`
  const result = await getConnection().query(sql, [])
  return result
}

export async function getActiveChallenges(operatorId: number) {
  const sql = `
        SELECT
          *
        FROM
          "challenges"
        WHERE
            "enabled" = true AND
            "txnStatus" = true AND
            "endTime" > NOW() AND
            CASE WHEN $1 = 1 then true else "operatorId" = $1 END
        ORDER BY
            "startTime" asc`
  const result = await getConnection().query(sql, [operatorId])
  return result
}
export async function getPreviousChallenges(operatorId: number) {
  const sql = `
        SELECT
          *
        FROM
          "challenges"
        WHERE
            "enabled" = true AND
            "txnStatus" = true AND
            "endTime" < NOW() AND
            CASE WHEN $1 = 1 then true else "operatorId" = $1 END
        ORDER BY
            "startTime" desc LIMIT 10`
  const result = await getConnection().query(sql, [operatorId])
  return result
}

export async function getAllCurrentChallenges() {
  const sql = `
        SELECT
          *
        FROM
          "challenges"
        WHERE
            "txnStatus" = true AND
            "endTime" > NOW()
        ORDER BY
            "startTime" asc`
  const result = await getConnection().query(sql, [])
  return result
}

export async function getChallengeSubmissions(challengeId: number) {
  const sql = `
  SELECT
  count(DISTINCT "userId") as "totalSubmission" 
  FROM
    "challenge_participations"
  WHERE
    "txnStatus" = true AND "challengeId" =$1`

  const result = await getConnection().query(sql, [challengeId])
  return result
}

export interface ReadValueConfiguration {
  limit?: number
  code: string
  scope: string
  table: string
  lower_bound?: string //asset’s corresponding template id
  upper_bound?: string ///asset’s corresponding template id
  json: boolean
  reverse?: boolean
  index_position?: number
  key_type?: string
}

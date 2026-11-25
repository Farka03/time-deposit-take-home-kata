import { readFileSync } from 'fs'
import { join } from 'path'
import { INestApplication } from '@nestjs/common'
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import { parse } from 'yaml'

// Same relative location from src/ and from the compiled dist/.
export const CONTRACT_PATH = join(__dirname, '..', '..', '..', '..', 'api', 'openapi.yaml')

export const loadContract = (): OpenAPIObject => parse(readFileSync(CONTRACT_PATH, 'utf8'))

/** Serves the hand-written contract (not one generated from code) with Swagger UI. */
export const serveContract = (app: INestApplication, path = 'swagger'): void => {
  SwaggerModule.setup(path, app, loadContract())
}

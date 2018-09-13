import { Request } from 'express'

import { PromiseTracker, elapsed, Logger } from '../../universal'
import resolveAllData from './helpers/recursive-task-resolver'
import { createResponse, routerContextHandler } from './router-context-handler'
import * as ServerRenderResults from './server-render-results'
import { renderAppToString, CreateAppElement } from './render-app-to-string'
import { WatchtowerEvents } from './render-events'

export { PromiseTracker }

export interface RenderOptions {
    log: Logger
    errorLocation: string
    appRender: CreateAppElement
    events?: WatchtowerEvents
}

export interface ServerSideRenderOptions extends RenderOptions {
    ssrTimeoutMs: number
}

export interface PageTag {
    /** The html tag to insert into the rendered html */
    tag: string
}

export interface PageTags {
    head: PageTag[]
    body: PageTag[]
}

export async function renderPageContents<SSRRequestProps extends object>(
    ssrRequestProps: SSRRequestProps,
    options: ServerSideRenderOptions,
    req: Request,
    promiseTracker: PromiseTracker,
): Promise<ServerRenderResults.ServerRenderResult<SSRRequestProps>> {
    let renderLocation = req.url
    const startTime = process.hrtime()

    const performSinglePassLocationRender = (location: string) =>
        renderAppToString(location, options.log, options.appRender, promiseTracker)

    const render = (location: string): ServerRenderResults.ServerRenderResult<SSRRequestProps> => {
        // Unsure we are not tracking events from previous render pass
        promiseTracker.reset()

        // We need to capture the store before we render
        // as any changes caused by the render will not be
        // included in the rendered content
        const storeStateAtRenderTime: SSRRequestProps = {
            ...(ssrRequestProps as object),
        } as any

        try {
            const renderResult = performSinglePassLocationRender(location)

            const result = routerContextHandler(renderResult, startTime, storeStateAtRenderTime)

            return result
        } catch (err) {
            // If we are already rendering the error location, bail
            if (renderLocation === options.errorLocation) {
                throw err
            }
            options.log.error(err)
            // Overwrite the render location with the error location
            renderLocation = options.errorLocation
            const errorRender = performSinglePassLocationRender(renderLocation)

            return createResponse({
                renderResult: errorRender,
                ssrRequestProps,
                startTime,
                statusCode: 500,
            })
        } finally {
            if (options.events && options.events.renderPerformed) {
                try {
                    options.events.renderPerformed(promiseTracker)
                } catch (err) {
                    // External event failed. Just log and continue
                    options.log.error({ err }, 'renderPerformed event failed')
                }
            }
        }
    }

    try {
        const initialRenderResult = render(renderLocation)

        // If we have not rendered successfully just return the render result
        if (initialRenderResult.type !== ServerRenderResults.ServerRenderResultType.Success) {
            return initialRenderResult
        }

        if (options.events && options.events.beginWaitingForTasks) {
            try {
                options.events.beginWaitingForTasks(elapsed(startTime))
            } catch (err) {
                // external event failed, log and continue
                options.log.error({ err }, 'beginWaitingForTasks threw, continuing')
            }
        }

        const dataResolved = await resolveAllData(
            options.log,
            promiseTracker,
            () => render(renderLocation),
            initialRenderResult,
            10,
            options.ssrTimeoutMs,
        )

        return dataResolved
    } catch (err) {
        const failure: ServerRenderResults.FailedRenderResult = {
            type: ServerRenderResults.ServerRenderResultType.Failure,
            errorMessage: 'Failed to do render',
            elapsed: elapsed(startTime),
            head: undefined,
        }
        options.log.error({ err }, 'Failed to render')

        return failure
    }
}


/* IMPORT */

import { BATCH } from '~/context'
import type { IEffect } from '~/types'
import { Stack } from '~/methods/debugger'

/* MAIN */

// Using 2 microtasks to give a chance to things using 1 microtask (like refs in Voby) to run first

class Scheduler {

  /* VARIABLES */

  waiting: [IEffect, Stack?][] = [];

  locked: boolean = false;
  queued: boolean = false;

  /* QUEUING API */

  flush = (stack?: Stack): void => {

    if (this.locked) return

    if (!this.waiting.length) return

    try {

      this.locked = true

      while (true) {

        const queue = this.waiting

        if (!queue.length) break

        this.waiting = []

        for (let i = 0, l = queue.length; i < l; i++) {

          queue[i][0].update(queue[i][1])

        }

      }

    } finally {

      this.locked = false

    }

  }

  queue = (stack?: Stack): void => {

    if (this.queued) return

    this.queued = true

    this.resolve(stack)

  }

  resolve = (stack?: Stack): void => {

    queueMicrotask(() => {

      queueMicrotask(() => {

        if (BATCH) {

          BATCH.finally(() => this.resolve(stack))

        } else {

          this.queued = false

          this.flush(stack)

        }

      })

    })

  }

  /* SCHEDULING API */

  schedule = (effect: IEffect, stack?: Stack): void => {

    this.waiting.push([effect, stack])

    this.queue(stack)

  }

}

/* EXPORT */

export default new Scheduler()

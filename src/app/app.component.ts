import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AnimationController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly animationCtrl = inject(AnimationController);

  readonly pageTransition = (baseEl: HTMLElement, opts?: { enteringEl?: HTMLElement; leavingEl?: HTMLElement }): any => {
    const enteringEl = opts?.enteringEl;
    const leavingEl = opts?.leavingEl;
    const root = this.animationCtrl.create().duration(280).easing('cubic-bezier(0.32, 0.72, 0, 1)');

    if (enteringEl) {
      const enter = this.animationCtrl
        .create()
        .addElement(enteringEl)
        .fromTo('opacity', '0', '1')
        .fromTo('transform', 'translateX(20px)', 'translateX(0)');
      root.addAnimation(enter);
    }
    if (leavingEl) {
      const leave = this.animationCtrl
        .create()
        .addElement(leavingEl)
        .fromTo('opacity', '1', '0.7')
        .fromTo('transform', 'translateX(0)', 'translateX(-10px)');
      root.addAnimation(leave);
    }
    return root;
  };
}

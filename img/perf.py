#!/usr/bin/env python
# a bar plot with errorbars
import numpy as np
import matplotlib.pyplot as plt

'''
200 lights stats

default         : 44ms (49+33+32+98+16+82+16+32+34+49)/10.0
scissor enabled : 16ms (15+16+17+15+16+17+16+15+16+17)/10.0

bloom enabled   : 48ms (34+88+27+49+74+24+50+33+50+49)/10.0
with scissor    : 19ms (17+32+17+15+15+33+15+16+17+16)/10.0

gaussian bloom  : 63ms (83+99+16+65+100+15+34+49+66+100)/10.0
with scissor    : 22ms (34+16+15+32+17+32+17+16+34+15)/10.0

toon shading    : 41ms (50+16+50+32+50+48+32+50+16+66)/10.0
with scissor    : 16ms (16+17+14+17+16+14+17+16+15+17)/10.0

motion blur     : 47ms (64+84+16+33+48+33+49+50+32+65)/10.0
with scissor    : 15ms (13+15+16+16+15+16+17+16+17+14)/10.0




'''


N = 5
defaultMeans = (44, 48, 63, 41, 47)

ind = np.arange(N)  # the x locations for the groups
width = 0.35       # the width of the bars

fig, ax = plt.subplots()
rects1 = ax.bar(ind, defaultMeans, width, color='#cc1111')

scissorMeans = (16, 19, 22, 16, 15)
rects2 = ax.bar(ind + width, scissorMeans, width, color='#0088cc')

# add some text for labels, title and axes ticks
ax.set_ylabel('time (ms)')
ax.set_title('render types')
ax.set_xticks(ind + width)
ax.set_xticklabels(('blinn-phong', 'bloom', 'gaussian\nbloom', 'toon\nshading', 'motion blur'))

ax.legend((rects1[0], rects2[0]), ('scissor test off', 'scissor test on'))
ax.axis((0,5,0,100))


def autolabel(rects):
    # attach some text labels
    for rect in rects:
        height = rect.get_height()
        ax.text(rect.get_x() + rect.get_width()/2., 1.05*height,
                '%d' % int(height),
                ha='center', va='bottom')

autolabel(rects1)
autolabel(rects2)

plt.show()

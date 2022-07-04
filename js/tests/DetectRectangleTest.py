#!/usr/bin/env python
# -*- coding: utf-8 -*
import numpy as np
import cv2
from cv2 import aruco

def main():
    cap = cv2.VideoCapture(0)
    # マーカーサイズ
    marker_length = 0.056 # [m]
    # マーカーの辞書選択
    dictionary = aruco.getPredefinedDictionary(aruco.DICT_ARUCO_ORIGINAL)

    camera_matrix = np.array([[639.87721705,0., 330.12073612],
                              [  0.        , 643.69687408, 208.61588364],
                              [  0.        ,   0.        ,   1.        ]])
    distortion_coeff = np.array([ 0, 0, 0, 0, 1 ])

    corner = np.array([[[429., 206.],
                [417., 246.],
                [349., 242.],
                [366., 204.]]])
    print((corner))

    rvec, tvec, _ = aruco.estimatePoseSingleMarkers(corner, marker_length, camera_matrix, distortion_coeff)

    # < rodoriguesからeuluerへの変換 >

    # 不要なaxisを除去
    tvec = np.squeeze(tvec)
    rvec = np.squeeze(rvec)
    print(tvec)
    print(rvec)
    # 回転ベクトルからrodoriguesへ変換
    rvec_matrix = cv2.Rodrigues(rvec)
    rvec_matrix = rvec_matrix[0] # rodoriguesから抜き出し
    # 並進ベクトルの転置
    transpose_tvec = tvec[np.newaxis, :].T
    # 合成
    proj_matrix = np.hstack((rvec_matrix, transpose_tvec))
    # オイラー角への変換
    euler_angle = cv2.decomposeProjectionMatrix(proj_matrix)[6] # [deg]

    print("x : " + str(tvec[0]))
    print("y : " + str(tvec[1]))
    print("z : " + str(tvec[2]))
    print("roll : " + str(euler_angle[0]))
    print("pitch: " + str(euler_angle[1]))
    print("yaw  : " + str(euler_angle[2]))

    # 可視化
    draw_pole_length = marker_length/2 # 現実での長さ[m]
    # aruco.drawAxis(img, camera_matrix, distortion_coeff, rvec, tvec, draw_pole_length)

if __name__ == '__main__':
    main()

# 正解例
# camera_matrix = np.array([[639.87721705,0., 330.12073612],
#                           [  0.        , 643.69687408, 208.61588364],
#                           [  0.        ,   0.        ,   1.        ]])
# distortion_coeff = np.array([ 5.66942769e-02, -6.05774927e-01, -7.42066667e-03, -3.09571466e-04, 1.92386974e+00])

# [[[429. 206.]
#   [417. 246.]
#   [349. 242.]
#   [366. 204.]]]
# x : 0.05001443451124772
# y : 0.012572133117370354
# z : 0.5347712302412188
# roll : [-148.92874475]
# pitch: [50.98491116]
# yaw  : [117.34599471]

# [[[430. 206.]
#   [418. 246.]
#   [351. 241.]
#   [367. 205.]]]
# x : 0.05159804258774366
# y : 0.012720886632807646
# z : 0.5403241321998523
# roll : [-149.01628061]
# pitch: [51.62405666]
# yaw  : [117.51938728]

# [[[433. 207.]
#   [422. 245.]
#   [354. 242.]
#   [369. 207.]]]
# x : 0.053517038479790884
# y : 0.013214719732334275
# z : 0.534324651672919
# roll : [-147.79520847]
# pitch: [53.92078385]
# yaw  : [117.8996723]

# [[[437. 208.]
#   [425. 244.]
#   [359. 244.]
#   [373. 210.]]]
# x : 0.057511714993389494
# y : 0.014472558132967885
# z : 0.5407347521949482
# roll : [-143.77918834]
# pitch: [54.71778714]
# yaw  : [119.45431682]